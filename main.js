const { ethers } = require("ethers");
// const provider = ethers.getDefaultProvider("homestead");
const provider = new ethers.providers.JsonRpcProvider("https://rpc.ankr.com/eth");


const EXCHANGES = {
  UNISWAP: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
  SUSHISWAP: "0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac",
}

const TOKENS = {
  USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
}

const STABLE_TOKEN = {
  WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
}

// this ABI object works for both Uniswap and SushiSwap
const SWAP_ABI = [
  "event Swap(address indexed sender, uint amount0In, uint amount1In, uint amount0Out, uint amount1Out, address indexed to)",
];

function calcRatio(price1, price2) {
  if (price1 == 0 || price2 == 0) {
    return 0;
  }

  diff = Math.abs(price1 - price2);
  ratioDiff = diff / Math.max(price1, price2);
  return ratioDiff;
}

// function getAmountsFromSwapArgs(swapArgs) {
//   const { amount0In, amount0Out, amount1In, amount1Out } = swapArgs;
//   // 1. The eq method is for objects created
//   //    from ethers.js BigNumber helper
//   // 2. Note, this code only handles simple one-to-one token swaps.
//   //    (It's also possible to swap both token0 and token1 for token0 and token1)
//   let token0AmountBigDecimal = amount0In;
//   if (token0AmountBigDecimal.eq(0)) {
//     token0AmountBigDecimal = amount0Out;
//   }

//   let token1AmountBigDecimal = amount1In;
//   if (token1AmountBigDecimal.eq(0)) {
//     token1AmountBigDecimal = amount1Out;
//   }

//   return { token0AmountBigDecimal, token1AmountBigDecimal };
// }

// function convertSwapEventToPrice({ swapArgs, token0Decimals, token1Decimals }) {
//   const {
//     token0AmountBigDecimal,
//     token1AmountBigDecimal,
//   } = getAmountsFromSwapArgs(swapArgs);

//   const token0AmountFloat = parseFloat(
//     ethers.utils.formatUnits(token0AmountBigDecimal, token0Decimals)
//   );
//   const token1AmountFloat = parseFloat(
//     ethers.utils.formatUnits(token1AmountBigDecimal, token1Decimals)
//   );

//   if (token1AmountFloat > 0) {
//     const priceOfToken0InTermsOfToken1 = token1AmountFloat / token0AmountFloat;
//     return { price: priceOfToken0InTermsOfToken1, volume: token0AmountFloat };
//   }

//   return null;
// }

// const uniswapContract = new ethers.Contract(
//   uniswapUsdtWethExchange,
//   uniswapAbi,
//   provider
// );
// const uniFilter = uniswapContract.filters.Swap();

// const sushiswapContract = new ethers.Contract(
//   sushiswapUsdtWethExchange,
//   uniswapAbi,
//   provider
// );
// const sushiFilter = sushiswapContract.filters.Swap();


// uniswapContract.on(uniFilter, (from, a0in, a0out, a1in, a1out, to, event) => {
//   const { price, volume } = convertSwapEventToPrice({
//     swapArgs: event.args,
//     // the USDC ERC20 uses 6 decimals
//     token0Decimals: 18,
//     // the WETH ERC20 uses 18 decimals
//     token1Decimals: 6,
//   });
//   uniswapPrice = price;
//   console.log(calcRatio(uniswapPrice, sushiswapPrice));
// });

// sushiswapContract.on(sushiFilter, (from, a0in, a0out, a1in, a1out, to, event) => {
//   const { price, volume } = convertSwapEventToPrice({
//     swapArgs: event.args,
//     // the USDC ERC20 uses 6 decimals
//     token0Decimals: 18,
//     // the WETH ERC20 uses 18 decimals
//     token1Decimals: 6,
//   });
//   sushiswapPrice = price;
//   console.log(calcRatio(uniswapPrice, sushiswapPrice));
// });

const EXCHANGES_ABI = [
  "function getPair(address token0, address token1) view returns (address)",
]

const main = async () => {
  Object.keys(EXCHANGES).forEach(async (exchange) => {
    const EXCHANGES_CONTRACT = new ethers.Contract(
      EXCHANGES[exchange],
      EXCHANGES_ABI,
      provider
    );
    try {
      const pair = await EXCHANGES_CONTRACT.getPair(TOKENS.USDC, TOKENS.WETH);
      console.log(`${exchange} pair: ${pair}`);
    } catch (e) {
      console.log(`${exchange} pair: ${e}`);
    }
  });
}

main()