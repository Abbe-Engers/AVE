const { ethers } = require("ethers");
// const provider = ethers.getDefaultProvider("homestead");
const provider = new ethers.providers.JsonRpcProvider("https://rpc.ankr.com/eth");

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
];

const PAIR_ABI = [
    "function token0() view returns (address)",
    "function token1() view returns (address)",
]

const TOKEN_ABI = [
    "function name() view returns (string)",
]

ALL_TOKENS = {};

const main = async () => {
    const EXCHANGES_CONTRACT = new ethers.Contract(
        EXCHANGES.UNISWAP,
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

        if (PAIR_CONTRACT.token0() === STABLE_TOKEN.WETH) {
            const TOKEN_CONTRACT = new ethers.Contract(
                PAIR_CONTRACT.token1(),
                TOKEN_ABI,
                provider,
            );

            const name = await TOKEN_CONTRACT.name();
            ALL_TOKENS[name] = PAIR_CONTRACT.token1();
        } else if (PAIR_CONTRACT.token1() === STABLE_TOKEN.WETH) {
            const TOKEN_CONTRACT = new ethers.Contract(
                PAIR_CONTRACT.token0(),
                TOKEN_ABI,
                provider,
            );

            const name = await TOKEN_CONTRACT.name();
            ALL_TOKENS[name] = PAIR_CONTRACT.token0();
        }

        console.log(i + "/" + allPairsLength.toNumber());
    }

    data = JSON.stringify(ALL_TOKENS, null, 2);
    fs.writeFileSync("./WETH-UNISWAP.json", data);
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

main();