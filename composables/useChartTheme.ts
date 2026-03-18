export function useChartTheme() {
  const colorMode = useColorMode()
  const isDark = computed(() => colorMode.value === 'dark')

  const tickColor = computed(() => isDark.value ? '#a1a1aa' : '#52525b') // zinc-400 / zinc-600
  const gridColor = computed(() => isDark.value ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)')
  const legendColor = computed(() => isDark.value ? '#d4d4d8' : '#3f3f46') // zinc-300 / zinc-700

  return { isDark, tickColor, gridColor, legendColor }
}
