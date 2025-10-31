function calculateRequiredN(base_xp, growth_rate, N) {
  return base_xp * Math.pow(growth_rate, N - 1);
}

function calculateMinXpN(requiredArray) {
  let sum = 0;
  for (let i = 0; i < requiredArray.length - 1; i++) {
    sum += requiredArray[i];
  }
  return sum;
}

function calculateMaxXpN(requiredArray) {
  let sum = 0;
  for (let i = 0; i < requiredArray.length; i++) {
    sum += requiredArray[i];
  }
  return sum - 1;
}

// Örnek kullanım
const base_xp = 100;
const growth_rate = 1.1;
const N = 5;

const requiredArray = [];
for (let i = 1; i <= N - 1; i++) {
  const requiredN = calculateRequiredN(base_xp, growth_rate, i);
  requiredArray.push(requiredN);
}

const minXpN = calculateMinXpN(requiredArray);
const maxXpN = calculateMaxXpN(requiredArray);

console.log(`Required N: ${calculateRequiredN(base_xp, growth_rate, N)}`);
console.log(`Min XpN: ${minXpN}`);
console.log(`Max XpN: ${maxXpN}`);
