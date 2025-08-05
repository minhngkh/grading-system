export interface ColorStyle {
  text: string;
  bg: string;
}

// Predefined color palette (10 colors) with merged dark mode classes
const colorPalette: ColorStyle[] = [
  {
    text: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-500 dark:bg-purple-600",
  },
  { text: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500 dark:bg-blue-600" },
  { text: "text-green-600 dark:text-green-400", bg: "bg-green-500 dark:bg-green-600" },
  { text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500 dark:bg-amber-600" },
  { text: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500 dark:bg-rose-600" },
  { text: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-500 dark:bg-cyan-600" },
  {
    text: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-500 dark:bg-indigo-600",
  },
  {
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500 dark:bg-emerald-600",
  },
  {
    text: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-500 dark:bg-orange-600",
  },
  { text: "text-pink-600 dark:text-pink-400", bg: "bg-pink-500 dark:bg-pink-600" },
];

export function createCriteriaColorMap(
  criteriaNames: string[],
): Record<string, ColorStyle> {
  const uniqueCriteria = [...new Set(criteriaNames)];
  const colorMap: Record<string, ColorStyle> = {};

  uniqueCriteria.forEach((name, index) => {
    colorMap[name] = colorPalette[index % colorPalette.length];
  });

  return colorMap;
}

export function getCriteriaColorStyle(
  name: string,
  colorMap: Record<string, ColorStyle>,
): ColorStyle {
  return (
    colorMap[name] || {
      text: "text-gray-600 dark:text-gray-400",
      bg: "bg-gray-500 dark:bg-gray-600",
    }
  );
}
