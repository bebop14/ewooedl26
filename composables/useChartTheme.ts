export function useChartTheme() {
  const colorMode = useColorMode()
  const isDark = computed(() => colorMode.value === 'dark')

  const tickColor = computed(() => isDark.value ? '#a1a1aa' : '#52525b') // zinc-400 / zinc-600
  const gridColor = computed(() => isDark.value ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)')
  const legendColor = computed(() => isDark.value ? '#d4d4d8' : '#3f3f46') // zinc-300 / zinc-700

  // Dataset colors — adapt to dark/light mode
  const primaryColor = computed(() => isDark.value ? '#fb923c' : '#f97316') // orange-400 / orange-500
  const primaryFill = computed(() => isDark.value ? 'rgba(251,146,60,0.15)' : 'rgba(249,115,22,0.12)')
  const mutedBarColor = computed(() => isDark.value ? '#52525b' : '#d4d4d8') // zinc-600 / zinc-300 — visible in both modes
  const pointBorderColor = computed(() => isDark.value ? '#18181b' : '#ffffff') // zinc-950 / white

  function rankBarColor(index: number): string {
    if (index === 0) return '#facc15' // gold — yellow-400, clearly distinct from orange
    if (index === 1) return '#9ca3af' // silver — gray-400
    if (index === 2) return '#92400e' // bronze — amber-900, deep copper-brown
    return isDark.value ? '#38bdf8' : '#0ea5e9' // sky-400 / sky-500 for rest
  }

  return {
    isDark,
    tickColor,
    gridColor,
    legendColor,
    primaryColor,
    primaryFill,
    mutedBarColor,
    pointBorderColor,
    rankBarColor,
  }
}
