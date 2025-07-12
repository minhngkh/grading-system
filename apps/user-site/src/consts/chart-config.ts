// Chart configuration constants to prevent re-creation on every render
export const CHART_COLORS: string[] = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export const CHART_CONFIG = {
  count: {
    label: "Assessments",
    color: "var(--chart-1)",
  },
} as const;

export const RANGE_COUNT = 5;

// Chart performance settings
export const CHART_PERFORMANCE_CONFIG = {
  // Reduce animation duration for better performance
  animationDuration: 200,
  // Disable unnecessary animations for large datasets
  disableAnimations: false,
  // Chart rendering options
  margin: {
    left: 32,
    right: 32,
    top: 40,
    bottom: 20,
  },
  // Tooltip settings
  tooltip: {
    animationDuration: 0, // Instant tooltip for better performance
  },
} as const;

// Performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  LARGE_DATASET: 100,
  LAZY_LOAD_THRESHOLD: 6,
  VIRTUALIZATION_THRESHOLD: 20,
} as const;
