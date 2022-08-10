const input = [1];

var firstMissingPositive = function (nums) {
    for (let i = 1; i <= nums.length + 1; i++) {
        if (nums.findIndex(x => x === i) === -1) {
            return i;
        }
    }
};

console.log(firstMissingPositive(input));