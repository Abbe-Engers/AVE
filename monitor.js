const { ethers, BigNumber } = require("ethers");
const secrets = require("./secrets.json");
const fs = require("fs");

// const provider = new ethers.providers.JsonRpcProvider("https://mainnet.infura.io/v3/745bce02e49840a9ad7382332124196d");
const provider = new ethers.providers.WebSocketProvider(secrets.infuraWSS);
const wallet = new ethers.Wallet(secrets.privateKey);
const signer = wallet.connect(provider);

const ALL_PAIRS = JSON.parse(fs.readFileSync("./STATIC/WETH-PAIR.json"));

const ETH_CHECKS = [0.01, 0.1, 1, 10, 100, 1000];

const SWAP_ABI = [
    "event Swap(address indexed sender, uint amount0In, uint amount1In, uint amount0Out, uint amount1Out, address indexed to)",
    "function getReserves() public view returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast )",
];

const ROUTERS = {
    uniswap: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    sushiswap: "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F",
};

const STABLE_TOKEN = {
    WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
};

const PAIR_ABI = [
    "function token0() public view returns (address)",
    "function token1() public view returns (address)",
];

const TOKEN_ABI = ["function decimals() public view returns (uint8)"];

const ROUTER_ABI = [
    "function getAmountsOut(uint256 amountIn, address[] memory path) public view returns(uint[] memory amounts)",
    "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[]calldata path, address to, uint deadline) external returns(uint[]memory amounts)",
];

let prices = {};
let decimals = {};

let highscore;

let totalProfit = 0;

async function WRITE_PRICE(price, token, exchange) {
    var token_prices = {};
    if (prices[token]) {
        token_prices = prices[token];
    }
    token_prices[exchange] = price;
    prices[token] = token_prices;

    // PRICES_TO_JSON();
}

function calcProfit(price1, price2) {
    const profit = Math.max(price1, price2) - Math.min(price1, price2);
    return profit;
}

function calcExchangeFees(price1, price2) {
    const fee1 = price1 * 0.003;
    const fee2 = price2 * 0.003;
    const feeTotal = fee1 + fee2;
    return feeTotal;
}

function calcGasFees(price) {
    return price * 0.002;
}

async function PRICES_TO_JSON() {
    data = JSON.stringify(prices, null, 2);
    fs.writeFileSync("./STATIC/WETH-PRICES.json", data);
}

function GET_AMOUNTS({ SWAP }) {
    const { amount0In, amount0Out, amount1In, amount1Out } = SWAP;

    let amount0Big = amount0In;
    if (amount0Big.eq(0)) {
        amount0Big = amount0Out;
    }

    let amount1Big = amount1In;
    if (amount1Big.eq(0)) {
        amount1Big = amount1Out;
    }

    return {
        amount0Big,
        amount1Big,
    };
}

function CONVERT_SWAP_TO_PRICE(SWAP, TOKEN_DECIMALS, switchTokens) {
    const { amount0Big, amount1Big } = GET_AMOUNTS({ SWAP });

    const amount0Float = parseFloat(
        ethers.utils.formatUnits(amount0Big, TOKEN_DECIMALS)
    );
    const amount1Float = parseFloat(ethers.utils.formatUnits(amount1Big, 18));

    if (amount1Float > 0 && amount0Float > 0) {
        let priceAgaintToken1 = amount1Float / amount0Float;
        if (switchTokens) {
            priceAgaintToken1 = amount0Float / amount1Float;
        }
        return priceAgaintToken1;
    }

    return null;
}

async function CHECK_ARB(exchange, exchanges, token, decimals, amount) {
    //iterate through [0.001, 0.01, 0.1, 1]
    const WETHamountIn = ethers.utils.parseEther(amount.toString());

    const currentRouterContract = new ethers.Contract(
        ROUTERS[exchange],
        ROUTER_ABI,
        signer
    );

    const otherExchanges = Object.keys(exchanges).filter((e) => e !== exchange);
    otherExchanges.forEach(async (otherExchange) => {
        const otherRouterContract = new ethers.Contract(
            ROUTERS[otherExchange],
            ROUTER_ABI,
            signer
        );

        const fixedSlippage = 0.005;
        const fixedGasFee = 0.001;

        try {
            //(current -> other)
            const amountsOutCurrent = await currentRouterContract.getAmountsOut(
                WETHamountIn,
                [STABLE_TOKEN.WETH, token]
            );
            const amountOutCurrentFormat = ethers.utils.formatUnits(
                amountsOutCurrent[1],
                decimals
            );
            const amountOutCurrentFormatSlipped = (
                amountOutCurrentFormat *
                (1 - fixedSlippage)
            )
                .toFixed(6)
                .toString();
            const amountOutCurrentParsed = ethers.utils.parseUnits(
                amountOutCurrentFormatSlipped,
                decimals
            );
            const amountsOutOther = await otherRouterContract.getAmountsOut(
                amountOutCurrentParsed,
                [token, STABLE_TOKEN.WETH]
            );
            const amountOutOtherFormat = ethers.utils.formatUnits(
                amountsOutOther[1],
                18
            );
            const amountOutOtherFormatSlipped = (
                amountOutOtherFormat *
                (1 - fixedSlippage)
            )
                .toFixed(6)
                .toString();

            //(other -> current)
            const amountsInOther = await otherRouterContract.getAmountsOut(
                WETHamountIn,
                [STABLE_TOKEN.WETH, token]
            );
            const amountInOtherFormat = ethers.utils.formatUnits(
                amountsInOther[1],
                decimals
            );
            const amountInOtherFormatSlipped = (
                amountInOtherFormat *
                (1 - fixedSlippage)
            )
                .toFixed(6)
                .toString();
            const amountInOtherParsed = ethers.utils.parseUnits(
                amountInOtherFormatSlipped,
                decimals
            );
            const amountsInCurrent = await currentRouterContract.getAmountsOut(
                amountInOtherParsed,
                [token, STABLE_TOKEN.WETH]
            );
            const amountInCurrentFormat = ethers.utils.formatUnits(
                amountsInCurrent[1],
                18
            );
            const amountInCurrentFormatSlipped = (
                amountInCurrentFormat *
                (1 - fixedSlippage)
            )
                .toFixed(6)
                .toString();

            const diffOut =
                Number(amountOutOtherFormatSlipped) - fixedGasFee * 2 - amount;
            const diffRatioOut = diffOut / amount;
            const diffIn =
                Number(amountInCurrentFormatSlipped) - fixedGasFee * 2 - amount;
            const diffRatioIn = diffIn / amount;

            if (diffOut > 0) {
                totalProfit += diffOut;
            }

            if (diffIn > 0) {
                totalProfit += diffIn;
            }

            const highest = Math.max(diffRatioOut, diffRatioIn);
            if (highest > highscore || highscore === undefined) {
                highscore = highest;
            }

            //show amount
            console.log("\x1b[32m", `@${amount} WETH`);
            console.log("\x1b[32m", "---------------------------------");
            console.log(
                "\x1b[32m",
                "current -> other: ",
                Number(
                    Number(amountOutOtherFormatSlipped - fixedGasFee * 2).toFixed(2)
                ),
                "\t",
                Number((diffRatioOut * 100).toFixed(2)),
                "%"
            );
            console.log(
                "\x1b[32m", "other -> current: ",
                Number(
                    Number(amountInCurrentFormatSlipped - fixedGasFee * 2).toFixed(2)
                ), "\t",
                Number((diffRatioIn * 100).toFixed(2)),
                "%"
            );
            console.log("\x1b[32m", "---------------------------------");
            console.log(
                "\x1b[32m",
                "current highest: \t",
                Number((highscore * 100).toFixed(2)),
                "%"
            );
            console.log(
                "\x1b[32m",
                "total profit: \t\t\t",
                Number(totalProfit),
                "WETH"
            );
        } catch (e) {
            console.log("\x1b[31m", "error: ", e);
        }
    });
}

const main = async () => {
    const AMOUNT_OF_PAIRS = Object.keys(ALL_PAIRS).length;
    console.log(`Found ${AMOUNT_OF_PAIRS} pairs`);
    for (const token in ALL_PAIRS) {
        for (const exchange in ALL_PAIRS[token]) {
            const PAIR_ADDRESS = ALL_PAIRS[token][exchange];

            const SWAP_CONTRACT = new ethers.Contract(
                PAIR_ADDRESS,
                SWAP_ABI,
                provider
            );
            const SWAP_FILTER = SWAP_CONTRACT.filters.Swap();

            const PAIR_CONTRACT = new ethers.Contract(
                PAIR_ADDRESS,
                PAIR_ABI,
                provider
            );

            let switchTokens = false;

            let TOKEN_ADDRESS = await PAIR_CONTRACT.token0();
            if (TOKEN_ADDRESS === STABLE_TOKEN.WETH) {
                TOKEN_ADDRESS = await PAIR_CONTRACT.token1();
                switchTokens = true;
            }

            const TOKEN_CONTRACT = new ethers.Contract(
                TOKEN_ADDRESS,
                TOKEN_ABI,
                provider
            );

            const TOKEN_DECIMALS = await TOKEN_CONTRACT.decimals();

            decimals[PAIR_ADDRESS] = TOKEN_DECIMALS;

            SWAP_CONTRACT.on(
                SWAP_FILTER,
                async (from, a0in, a0out, a1in, a1out, to, event) => {
                    console.log(`${token} on ${exchange}`);

                    ETH_CHECKS.forEach(async (amount) => {
                        CHECK_ARB(
                            exchange,
                            ALL_PAIRS[token],
                            TOKEN_ADDRESS,
                            TOKEN_DECIMALS,
                            amount
                        );
                    });
                }
            );

            console.log(token, exchange);
        }
    }

    console.log("DONE SETTING UP CONTRACTS");
};

main();
