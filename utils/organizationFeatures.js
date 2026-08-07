/**
 * Organization feature flag helpers (shared platform integrations).
 */

export const ORG_FEATURE_KEYS = [
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'livekit', label: 'LiveKit' },
  { key: 'facescan', label: 'Face scan' },
  { key: 'online_consultation', label: 'Online consult' },
  { key: 'referrals', label: 'Referrals' },
]

/** href prefix → required feature_flags key (module hidden when flag false) */
export const NAV_FEATURE_GATES = {
  '/settings/integrations': 'whatsapp',
  '/facescan': 'facescan',
  '/rewards': 'referrals',
  '/referrals': 'referrals',
}

export function getActiveOrganization(authState) {
  const orgs = authState?.organizations || authState?.user?.organizations || []
  const activeId =
    authState?.activeOrganizationId ||
    authState?.user?.active_organization_id ||
    authState?.user?.primary_organization_id
  return orgs.find((o) => o.id === activeId) || orgs[0] || null
}

export function isOrgFeatureEnabled(org, featureKey) {
  if (!featureKey) return true
  if (!org) return true
  const flags = org.feature_flags || {}
  if (!(featureKey in flags)) return true
  return Boolean(flags[featureKey])
}

export function filterNavItemsByOrgFeatures(items, org) {
  if (!items?.length) return []
  if (!org) return items

  const filtered = []
  for (const item of items) {
    const children = item.children?.length
      ? filterNavItemsByOrgFeatures(item.children, org)
      : []

    const href = item.href || ''
    const gateKey = Object.entries(NAV_FEATURE_GATES).find(([prefix]) =>
      href === prefix || href.startsWith(`${prefix}/`)
    )?.[1]

    if (gateKey && !isOrgFeatureEnabled(org, gateKey)) {
      if (children.length) {
        filtered.push({ ...item, href: null, children })
      }
      continue
    }

    if (children.length > 0) {
      filtered.push({
        ...item,
        children,
      })
      continue
    }

    filtered.push({ ...item, children: undefined })
  }
  return filtered
}
