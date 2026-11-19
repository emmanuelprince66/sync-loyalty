import type { AccessRule } from './sink-permissions'

/**
 * maheleKart screens and actions → sink-inventory's permission keys (utils/pageAccess.ts):
 * /customers/growth → loyalty:view, /customers → customers:view, /campaign → campaigns:view, settings → settings:view.
 * Same rule order as the other apps (lib/sink-permissions.ts): owner → checklist → flag → role rule.
 */
export const ACCESS = {
  // ─── Loyalty (sink: Customers › Growth) ─────────────────────────────────
  loyalty: { matrix: ['loyalty:view'], roles: 'everyone' },
  manageLoyalty: { matrix: ['loyalty:create', 'loyalty:edit'], roles: 'adminLike' },
  /** Check in a member and redeem rewards at the till. */
  scanner: { matrix: ['loyalty:view', 'sales:create'], flag: 'process_sales', roles: 'everyone' },
  rewards: { matrix: ['loyalty:view'], roles: 'everyone' },

  // ─── Customers ──────────────────────────────────────────────────────────
  customers: { matrix: ['customers:view'], roles: 'everyone' },
  addCustomers: { matrix: ['customers:create'], roles: 'everyone' },
  editCustomers: { matrix: ['customers:edit'], roles: 'everyone' },
  deleteCustomers: { matrix: ['customers:delete'], roles: 'adminLike' },

  // ─── Messages (sink: Campaign) ──────────────────────────────────────────
  messages: { matrix: ['campaigns:view'], roles: 'adminLike' },
  sendMessages: { matrix: ['campaigns:create', 'campaigns:send'], roles: 'adminLike' },
  /** Buying credits opens a payment page (campaign/fund), as in sink. */
  buyCredits: { matrix: ['campaigns:create'], roles: 'adminLike' },

  // ─── Setup ──────────────────────────────────────────────────────────────
  setup: { matrix: ['settings:view'], roles: 'adminLike' },
} as const satisfies Record<string, AccessRule>

export type AccessArea = keyof typeof ACCESS

/** Routes → the area that opens them. Most specific first; Overview and Customer view are open to every signed-in user. */
export const PAGE_AREAS: readonly (readonly [string, AccessArea])[] = [
  ['/loyalty', 'loyalty'],
  ['/scanner', 'scanner'],
  // ['/card-studio', 'manageLoyalty'], // Card studio is switched off: sink has none; the join card lives on each programme (QR) and takes the store colour.
  ['/rewards', 'rewards'],
  ['/customers/import', 'addCustomers'],
  ['/customers', 'customers'],
  ['/segments', 'customers'],
  ['/insights', 'loyalty'],
  ['/referrals', 'loyalty'],
  ['/messages', 'messages'],
  ['/settings', 'setup'],
  // ['/kyc', 'setup'], // KYC is switched off in maheleKart for now (commented out, not deleted).
  ['/plan', 'setup'],
]
