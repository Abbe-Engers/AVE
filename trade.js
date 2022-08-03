const { ethers } = require("ethers");
const secrets = require("./secrets.json");
const fs = require("fs");

// const provider = new ethers.providers.JsonRpcProvider("https://mainnet.infura.io/v3/745bce02e49840a9ad7382332124196d");
const provider = new ethers.providers.WebSocketProvider(secrets.infuraWSS);
const wallet = new ethers.Wallet(secrets.privateKey);
const signer = wallet.connect(provider);

const ADDRESSES = {
    router: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    pair: "0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc"
}

const pairABI = [
    "function getReserves() public view returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast )",
]

const routerABI = [
    "function getAmountsOut(uint256 amountIn, address[] memory path) public view returns(uint[] memory amounts)",
    "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[]calldata path, address to, uint deadline) external returns(uint[]memory amounts)",
]

const pairContract = new ethers.Contract(
    ADDRESSES.pair, 
    pairABI, 
    provider
);

const routerContract = new ethers.Contract(
    ADDRESSES.router,
    routerABI,
    signer
);

const main = async () => {
    const balance = await signer.getBalance();
    const balanceEth = ethers.utils.formatEther(balance);
    console.log(Number(balanceEth));

    const reserves = await pairContract.getReserves();
    console.log(reserves);
}

main();