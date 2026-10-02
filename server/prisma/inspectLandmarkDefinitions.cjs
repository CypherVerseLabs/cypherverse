const fs = require("fs");

const file = fs.readFileSync(
  "server/data/cypherVerseLandmarks.ts",
  "utf8",
);

const matches = [
  ...file.matchAll(
    /estateId:\s*"([^"]+)"[\s\S]*?x:\s*(-?\d+),\s*y:\s*(-?\d+),[\s\S]*?name:\s*"([^"]+)"/g,
  ),
];

console.log(`Found ${matches.length} landmark definitions:`);

matches.forEach((match, index) => {
  console.log(
    `${String(index + 1).padStart(2, "0")}. ${match[4]} | ` +
    `(${match[2]},${match[3]}) | ${match[1]}`
  );
});
