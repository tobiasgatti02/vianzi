export function calculateScore(state) {
  let score = 0;

  if (state.hasCar === true) score += 30;
  if (state.capital >= state.minimumCapital) score += 40;
  if (state.acceptsQuota === true) score += 30;

  return score;
}