const { ethers } = require("ethers");
const secrets = require("./secrets.json");
const fs = require("fs");

// const provider = new ethers.providers.JsonRpcProvider("https://mainnet.infura.io/v3/745bce02e49840a9ad7382332124196d");
const provider = new ethers.providers.WebSocketProvider(secrets.infuraWSS);
const wallet = new ethers.Wallet(secrets.privateKey);
const signer = wallet.connect(provider);

const ADDRESSES = {
    router: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    pair: "0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11"
}

const pairABI = [
    "function getReserves() public view returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast )",
    "function token0() public view returns (address)",
    "function token1() public view returns (address)",
]

const routerABI = [
    "function getAmountsOut(uint256 amountIn, address[] memory path) public view returns(uint[] memory amounts)",
    "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[]calldata path, address to, uint deadline) external returns(uint[]memory amounts)",
]

const tokenABI = [
    "function decimals() public view returns (uint8)",
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
    //get amounts out
    const ETHamountIn = ethers.utils.parseEther("1");
    const token0 = await pairContract.token0();
    const token1 = await pairContract.token1();

    const tokenContract = new ethers.Contract(
        token0, 
        tokenABI,
        provider
    );

    console.log(token0, token1);
    try {
        const decimals = await tokenContract.decimals();

        const amounts = await routerContract.getAmountsOut(ETHamountIn, [token1, token0]);
        const amountOut = ethers.utils.formatUnits(amounts[1], decimals);

        const DAIamountIn = ethers.utils.parseUnits(amountOut, decimals);
        const amountsOutWETH = await routerContract.getAmountsOut(DAIamountIn, [token0, token1]);

        const amountOutWETH = ethers.utils.formatUnits(amountsOutWETH[1], decimals);

        console.log(amountOutWETH);

        

        // console.log(Number(amountOut));
    } catch (e) {
        console.log(e);
    }
    // const amounts = await routerContract.getAmountsOut(ETHamountIn, [token0, token1]);
    // console.log(amounts);
}

main();