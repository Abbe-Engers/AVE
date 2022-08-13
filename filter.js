const { ethers } = require("ethers");
const fs = require("fs");
const secrets = require("./secrets.json");
// const provider = ethers.getDefaultProvider("homestead");
// const provider = new ethers.providers.JsonRpcProvider("https://mainnet.infura.io/v3/745bce02e49840a9ad7382332124196d");
const provider = new ethers.providers.WebSocketProvider(secrets.infuraWSS);


const ROUTERS = {
    uniswap: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    sushiswap: "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F",
};

const EXCHANGES = {
    UNISWAP: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
    SUSHISWAP: "0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac",
}

const STABLE_TOKEN = {
    WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
}

const EXCHANGES_ABI = [
    "function allPairsLength() view returns (uint256)",
    "function allPairs(uint256) view returns (address)",
    "function getPair(address,address) view returns (address)",
];

const PAIR_ABI = [
    "function token0() view returns (address)",
    "function token1() view returns (address)",
]

const TOKEN_ABI = [
    "function symbol() view returns (string)",
]

const ROUTER_ABI = [
    "function getAmountsOut(uint256 amountIn, address[] memory path) public view returns(uint[] memory amounts)",
    "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[]calldata path, address to, uint deadline) external returns(uint[]memory amounts)",
];

ALL_TOKENS = {};

const main = async () => {
    const EXCHANGES_CONTRACT = new ethers.Contract(
        EXCHANGES.SUSHISWAP,
        EXCHANGES_ABI,
        provider
    );

    const allPairsLength = await EXCHANGES_CONTRACT.allPairsLength();

    console.log(allPairsLength.toNumber());

    for (let i = 0; i < allPairsLength.toNumber(); i++) {
        const pair = await EXCHANGES_CONTRACT.allPairs(i);
        const PAIR_CONTRACT = new ethers.Contract(
            pair,
            PAIR_ABI,
            provider,
        );

        const token0 = await PAIR_CONTRACT.token0();
        const token1 = await PAIR_CONTRACT.token1();

        if (token0 === STABLE_TOKEN.WETH) {
            const TOKEN_CONTRACT = new ethers.Contract(
                token1,
                TOKEN_ABI,
                provider,
            );

            try {
                const symbol = await TOKEN_CONTRACT.symbol();
                ALL_TOKENS[symbol] = token1;
            } catch (e) {
                console.log(e);
            }
        } else if (token1 === STABLE_TOKEN.WETH) {
            const TOKEN_CONTRACT = new ethers.Contract(
                token0,
                TOKEN_ABI,
                provider,
            );

            try {
                const symbol = await TOKEN_CONTRACT.symbol();
                ALL_TOKENS[symbol] = token0;
            } catch (e) {
                console.log(e);
            }
        }

        console.log(i + "/" + allPairsLength.toNumber());
    }

    data = JSON.stringify(ALL_TOKENS, null, 2);
    fs.writeFileSync("./STATIC/WETH-SUSHI.json", data);
}

// const main = async () => {
//     Object.keys(EXCHANGES).forEach(async (exchange) => {
//         const EXCHANGES_CONTRACT = new ethers.Contract(
//         EXCHANGES[exchange],
//         EXCHANGES_ABI,
//         provider
//         );
//         try {
//         const pair = await EXCHANGES_CONTRACT.getPair(TOKENS.USDC, TOKENS.WETH);
//         console.log(`${exchange} pair: ${pair}`);
//         } catch (e) {
//         console.log(`${exchange} pair: ${e}`);
//         }
//     });
// }

// main();

// const scan = async () => {
//     let rawdata = fs.readFileSync("./STATIC/WETH-SUSHI.json"); 
//     let tokens = Object.values(JSON.parse(rawdata));
//     let symbols = Object.keys(JSON.parse(rawdata));

//     PAIRED_TOKENS = {};

//     for (let i = 0; i < tokens.length; i++) {
//         const UNISWAP_CONTRACT = new ethers.Contract(
//             EXCHANGES.UNISWAP,
//             EXCHANGES_ABI,
//             provider,
//         );

//         const SUSHISWAP_CONTRACT = new ethers.Contract(
//             EXCHANGES.SUSHISWAP,
//             EXCHANGES_ABI,
//             provider,
//         );

//         try {
//             const unipair = await UNISWAP_CONTRACT.getPair(tokens[i], STABLE_TOKEN.WETH);

//             if (unipair === "0x0000000000000000000000000000000000000000") {
//                 continue;
//             }

//             const sushipair = await SUSHISWAP_CONTRACT.getPair(tokens[i], STABLE_TOKEN.WETH);
//             PAIRED_TOKENS[symbols[i]] = {
//                 uniswap: unipair,
//                 sushiswap: sushipair,
//             };
//         } catch (e) {
//             console.log(e);
//         }

//         console.log(i + "/" + tokens.length);
//     }

//     data = JSON.stringify(PAIRED_TOKENS, null, 2);
//     fs.writeFileSync("./STATIC/WETH-PAIR.json", data);
// }

// scan()

const filterAndRemove = async () => {
    let rawdata = fs.readFileSync("./STATIC/WETH-PAIR.json");
    let whole = JSON.parse(rawdata);
    let tokens = Object.values(whole);
    let symbols = Object.keys(whole);

    const routerContract = new ethers.Contract(
        ROUTERS.sushiswap,
        ROUTER_ABI,
        provider,
    );

    console.log(tokens.length);

    for (let i = 0; i < tokens.length; i++) {
        console.log(symbols[i]);

        const pairContract = new ethers.Contract(
            tokens[i].sushiswap,
            PAIR_ABI,
            provider,
        );

        const token0 = await pairContract.token0();
        const token1 = await pairContract.token1();

        const ETH = 1
        const amount = ethers.utils.parseEther(ETH.toString());

        var tokensIn;

        try {
            if (token0 === STABLE_TOKEN.WETH) {
                const tokensAway = await routerContract.getAmountsOut(amount, [token0, token1]);
                tokensIn = await routerContract.getAmountsOut(tokensAway[1], [token1, token0]);

            } else if (token1 === STABLE_TOKEN.WETH) {
                const tokensAway = await routerContract.getAmountsOut(amount, [token1, token0]);
                tokensIn = await routerContract.getAmountsOut(tokensAway[1], [token0, token1]);
            }

            const resFormatted = ethers.utils.formatEther(tokensIn[1]);
            console.log(resFormatted);

            if (resFormatted < (ETH * 0.5)) {
                console.log("removing");
                delete whole[symbols[i]];
            }
        } catch (e) {
            console.log(e);
            console.log("removing");
            delete whole[symbols[i]];
        }
    }

    console.log(Object.keys(whole).length);

    data = JSON.stringify(whole, null, 2);
    fs.writeFileSync("./STATIC/WETH-PAIR.json", data);
}

filterAndRemove()