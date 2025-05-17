export interface ColorStyle {
  text: string;
  bg: string;
}

export const criteriaColors: Record<string, ColorStyle> = {
  Content: { text: "text-purple-600", bg: "bg-purple-500" },
  Structure: { text: "text-blue-600", bg: "bg-blue-500" },
  Clarity: { text: "text-green-600", bg: "bg-green-500" },
  Analysis: { text: "text-amber-600", bg: "bg-amber-500" },
  References: { text: "text-rose-600", bg: "bg-rose-500" },
};

export const getCriteriaColorStyle = (name: string): ColorStyle => {
  if (Object.keys(criteriaColors).includes(name)) {
    return criteriaColors[name];
  }
  return { text: "text-gray-600", bg: "bg-gray-500" };
};
