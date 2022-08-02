const { ethers } = require("ethers");
const fs = require("fs");

const provider = new ethers.providers.JsonRpcProvider("https://mainnet.infura.io/v3/745bce02e49840a9ad7382332124196d");

const ALL_PAIRS = JSON.parse(fs.readFileSync("./STATIC/TEST-PAIR.json"));

const SWAP_ABI = [
    "event Swap(address indexed sender, uint amount0In, uint amount1In, uint amount0Out, uint amount1Out, address indexed to)",
];

const STABLE_TOKEN = {
    WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
}

const PAIR_ABI = [
    "function token0() public view returns (address)",
    "function token1() public view returns (address)",
]

const TOKEN_ABI = [
    "function decimals() public view returns (uint8)",
]

let prices = {};
let decimals = {};

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
    }
}

function CONVERT_SWAP_TO_PRICE( SWAP, TOKEN_DECIMALS, switchTokens) {
    const {
        amount0Big,
        amount1Big,
    } = GET_AMOUNTS({ SWAP });

    const amount0Float = parseFloat(
        ethers.utils.formatUnits(amount0Big, TOKEN_DECIMALS)
    );
    const amount1Float = parseFloat(
        ethers.utils.formatUnits(amount1Big, 18)
    );

    if (amount1Float > 0 && amount0Float > 0) {
        let priceAgaintToken1 = amount1Float / amount0Float;
        if (switchTokens) {
            priceAgaintToken1 = amount0Float / amount1Float;
        }
        return priceAgaintToken1;
    }

    return null;
}

const main = async () => {
    for (const token in ALL_PAIRS) {
        for (const exchange in ALL_PAIRS[token]) {
            const PAIR_ADDRESS = ALL_PAIRS[token][exchange];
    
            const SWAP_CONTRACT = new ethers.Contract(
                PAIR_ADDRESS,
                SWAP_ABI,
                provider
            )
            const SWAP_FILTER = SWAP_CONTRACT.filters.Swap();
    
            const PAIR_CONTRACT = new ethers.Contract(
                PAIR_ADDRESS,
                PAIR_ABI,
                provider
            )

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
            )
    
            const TOKEN_DECIMALS = await TOKEN_CONTRACT.decimals();

            decimals[PAIR_ADDRESS] = TOKEN_DECIMALS;
    
            SWAP_CONTRACT.on(SWAP_FILTER, (from, a0in, a0out, a1in, a1out, to, event) => {
                const price = CONVERT_SWAP_TO_PRICE( event.args, decimals[PAIR_ADDRESS], switchTokens);

                var token_prices = {};
                if (prices[token]) {
                    token_prices = prices[token];
                }
                token_prices[exchange] = price;
                prices[token] = token_prices;


                // console.log(prices)

                data = JSON.stringify(prices, null, 2);
                fs.writeFileSync("./STATIC/WETH-PRICES.json", data);
                // console.log(`${token} on ${exchange} for ${price}`)
            })
    
            console.log(token, exchange);
            //console.log(PAIR_ADDRESS);
        }
    }

    console.log("DONE SETTING UP CONTRACTS")
}

main()