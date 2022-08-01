const { ethers } = require("ethers");
const fs = require("fs");

const provider = new ethers.providers.JsonRpcProvider("https://rpc.ankr.com/eth");

//read the file
const ALL_PAIRS = JSON.parse(fs.readFileSync("./STATIC/TEST-PAIR.json"));

for (const key in ALL_PAIRS) {
    console.log(key);
}