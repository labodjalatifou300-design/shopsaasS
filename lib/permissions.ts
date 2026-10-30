export const PERMISSION_GROUPS = [
  {
    module: 'Commandes',
    items: [
      { key: 'orders.read', label: 'Voir les commandes' },
      { key: 'orders.write', label: 'Confirmer, modifier, ajouter des notes' },
      { key: 'orders.ship', label: 'Expédier et marquer livrée / retournée' },
    ],
  },
  {
    module: 'Produits',
    items: [
      { key: 'products.read', label: 'Voir les produits' },
      { key: 'products.write', label: 'Créer et modifier les produits' },
      { key: 'pages.write', label: 'Modifier les pages produits' },
    ],
  },
  {
    module: 'Marchés',
    items: [
      { key: 'markets.read', label: 'Voir le marché de la boutique' },
      { key: 'markets.write', label: 'Modifier les réglages du marché' },
    ],
  },
  {
    module: 'Chiffres et export',
    items: [
      { key: 'analytics.read', label: 'Voir le chiffre d’affaires et les stats' },
      { key: 'export.read', label: 'Exporter vers Google Sheets / CSV' },
    ],
  },
  {
    module: 'Administration',
    items: [
      { key: 'settings.write', label: 'Réglages de la boutique et pixel' },
      { key: 'team.write', label: 'Gérer l’équipe et les rôles' },
    ],
  },
] as const

export type Permission = (typeof PERMISSION_GROUPS)[number]['items'][number]['key']

export const ALL_PERMISSIONS: Permission[] = PERMISSION_GROUPS.flatMap((g) => g.items.map((i) => i.key))

export function can(perms: readonly string[] | null | undefined, p: Permission): boolean {
  if (!perms) return false
  return perms.includes('*') || perms.includes(p)
}
