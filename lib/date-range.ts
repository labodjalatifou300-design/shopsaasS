export function getDateBounds(range: string | undefined, from?: string, to?: string) {
  const now = new Date()

  if (range === 'custom' && from && to) {
    return { start: new Date(`${from}T00:00:00`), end: new Date(`${to}T23:59:59.999`) }
  }
  if (range === 'custom' && from) {
    const start = new Date(`${from}T00:00:00`)
    return { start, end: now }
  }

  if (range === 'today') {
    const start = new Date(now); start.setHours(0, 0, 0, 0)
    return { start, end: now }
  }

  if (range === 'yesterday') {
    const start = new Date(now); start.setDate(start.getDate() - 1); start.setHours(0, 0, 0, 0)
    const end = new Date(start); end.setHours(23, 59, 59, 999)
    return { start, end }
  }

  if (range === '30d') {
    const start = new Date(now); start.setDate(start.getDate() - 29); start.setHours(0, 0, 0, 0)
    return { start, end: now }
  }

  if (range === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    return { start, end: now }
  }

  if (range === 'lastmonth') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
    return { start, end }
  }

  // Défaut : 7 derniers jours
  const start = new Date(now); start.setDate(start.getDate() - 6); start.setHours(0, 0, 0, 0)
  return { start, end: now }
}
