export function getScoreDistribution(
  scores: number[],
  max: number = 100,
  binsCount: number = 10,
): number[] {
  const bins = new Array(binsCount).fill(0);

  scores.forEach((score) => {
    const percentage = (score / max) * 100;
    let index = Math.floor((percentage / 100) * binsCount);
    if (index === binsCount) index = binsCount - 1; // handle edge case for 100%
    bins[index]++;
  });

  return bins;
}
