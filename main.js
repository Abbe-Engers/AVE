const { ethers } = require("ethers");
// const provider = ethers.getDefaultProvider("homestead");
const provider = new ethers.providers.JsonRpcProvider("https://rpc.ankr.com/eth");


const uniswapUsdtWethExchange = "0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc";
const sushiswapUsdtWethExchange = "0x397ff1542f962076d0bfe58ea045ffa2d347aca0";

// this ABI object works for both Uniswap and SushiSwap
const uniswapAbi = [
  "event Swap(address indexed sender, uint amount0In, uint amount1In, uint amount0Out, uint amount1Out, address indexed to)",
];

sushiswapPrice = 0;
uniswapPrice = 0;

function calcRatio(price1, price2) {
  if (price1 == 0 || price2 == 0) {
    return 0;
  }

  diff = Math.abs(price1 - price2);
  ratioDiff = diff / Math.max(price1, price2);
  return ratioDiff;
}

function getAmountsFromSwapArgs(swapArgs) {
  const { amount0In, amount0Out, amount1In, amount1Out } = swapArgs;
  // 1. The eq method is for objects created
  //    from ethers.js BigNumber helper
  // 2. Note, this code only handles simple one-to-one token swaps.
  //    (It's also possible to swap both token0 and token1 for token0 and token1)
  let token0AmountBigDecimal = amount0In;
  if (token0AmountBigDecimal.eq(0)) {
    token0AmountBigDecimal = amount0Out;
  }

  let token1AmountBigDecimal = amount1In;
  if (token1AmountBigDecimal.eq(0)) {
    token1AmountBigDecimal = amount1Out;
  }

  return { token0AmountBigDecimal, token1AmountBigDecimal };
}

function convertSwapEventToPrice({ swapArgs, token0Decimals, token1Decimals }) {
  const {
    token0AmountBigDecimal,
    token1AmountBigDecimal,
  } = getAmountsFromSwapArgs(swapArgs);

  const token0AmountFloat = parseFloat(
    ethers.utils.formatUnits(token0AmountBigDecimal, token0Decimals)
  );
  const token1AmountFloat = parseFloat(
    ethers.utils.formatUnits(token1AmountBigDecimal, token1Decimals)
  );

  if (token1AmountFloat > 0) {
    const priceOfToken0InTermsOfToken1 = token1AmountFloat / token0AmountFloat;
    return { price: priceOfToken0InTermsOfToken1, volume: token0AmountFloat };
  }

  return null;
}

const uniswapContract = new ethers.Contract(
  uniswapUsdtWethExchange,
  uniswapAbi,
  provider
);
const uniFilter = uniswapContract.filters.Swap();

const sushiswapContract = new ethers.Contract(
  sushiswapUsdtWethExchange,
  uniswapAbi,
  provider
);
const sushiFilter = sushiswapContract.filters.Swap();


uniswapContract.on(uniFilter, (from, a0in, a0out, a1in, a1out, to, event) => {
  const { price, volume } = convertSwapEventToPrice({
    swapArgs: event.args,
    // the USDC ERC20 uses 6 decimals
    token0Decimals: 18,
    // the WETH ERC20 uses 18 decimals
    token1Decimals: 6,
  });
  uniswapPrice = price;
  console.log(calcRatio(uniswapPrice, sushiswapPrice));
});

sushiswapContract.on(sushiFilter, (from, a0in, a0out, a1in, a1out, to, event) => {
  const { price, volume } = convertSwapEventToPrice({
    swapArgs: event.args,
    // the USDC ERC20 uses 6 decimals
    token0Decimals: 18,
    // the WETH ERC20 uses 18 decimals
    token1Decimals: 6,
  });
  sushiswapPrice = price;
  console.log(calcRatio(uniswapPrice, sushiswapPrice));
});