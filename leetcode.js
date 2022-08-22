const input = ["flower", "flow", "flight"];

var longestCommonPrefix = function (strs) {
    for (let j = 0; j < strs[0].length; j++) {
        const char = strs[0][j];
        strs.map((x) => {
            console.log(x[j], char, j)
            if (x[j] != char) {
                console.log("dir")
                return strs[0].slice(0, j);
            }
        })
    }

    console.log("kanker")
    return strs[0];
};

console.log(longestCommonPrefix(input));