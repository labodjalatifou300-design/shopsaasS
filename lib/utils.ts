export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export function slugify(input: string, max = 60) {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, max)
    .replace(/-+$/g, '')
}

export function formatMoney(amount: number | string | null | undefined, currency: string) {
  if (amount === null || amount === undefined || amount === '') return '—'
  const n = typeof amount === 'string' ? Number(amount) : amount
  const zeroDecimals = ['XOF', 'XAF', 'GNF', 'CDF', 'NGN'].includes(currency)
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      maximumFractionDigits: zeroDecimals ? 0 : 2,
    }).format(n)
  } catch {
    return `${n} ${currency}`
  }
}

export const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000'

export function storeUrl(slug: string, path = '') {
  const proto = ROOT_DOMAIN.startsWith('localhost') ? 'http' : 'https'
  return `${proto}://${slug}.${ROOT_DOMAIN}${path}`
}

/** Empêche les redirections ouvertes : seulement des chemins internes */
export function safeNext(value: FormDataEntryValue | string | null | undefined): string | null {
  const v = typeof value === 'string' ? value : ''
  return v.startsWith('/') && !v.startsWith('//') ? v : null
}
