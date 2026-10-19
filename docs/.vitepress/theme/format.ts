// 3498752 -> "3.50M", 634178 -> "634K"
export function formatOps(ops: number) {
  if (ops >= 1e6) return `${(ops / 1e6).toFixed(2)}M`;
  if (ops >= 1e4) return `${Math.round(ops / 1e3)}K`;
  return `${(ops / 1e3).toFixed(1)}K`;
}

// 1.19 -> "1.2×", 87.4 -> "87×"
export function formatRatio(ratio: number) {
  return ratio >= 10 ? `${Math.round(ratio)}×` : `${ratio.toFixed(1)}×`;
}
