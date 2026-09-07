/** Match inzapp-web: https→wss, http→ws before Room.connect. */
export function normalizeLiveKitUrl(url) {
  const trimmed = String(url || '').trim()
  if (trimmed.startsWith('https://')) {
    return trimmed.replace('https://', 'wss://')
  }
  if (trimmed.startsWith('http://')) {
    return trimmed.replace('http://', 'ws://')
  }
  return trimmed
}
