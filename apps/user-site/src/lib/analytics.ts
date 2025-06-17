export function getScoreDistribution(scores: number[]): number[] {
  const bins = new Array(10).fill(0);

  scores.forEach((score) => {
    const percentage = score; // assuming out of 100
    let index = Math.floor(percentage / 10);
    if (index === 10) index = 9; // handle edge case for 100
    bins[index]++;
  });

  return bins;
}
