export const paths = {
  login: '/login',
  signup: '/signup',
  signupVerify: '/signup/verify',
  signupBusiness: '/signup/business',
  signupKyc: '/signup/kyc',
  selectBusiness: '/select-business',
  dashboard: '/',
  overview: '/',
  loyalty: '/loyalty',
  /** One programme: `${paths.loyalty}/:programId`. */
  programDetail: '/loyalty/:programId',
  customers: '/customers',
  /** Bulk upload (sink's customers/upload). */
  importCustomers: '/customers/import',
  segments: '/segments',
  insights: '/insights',
  referrals: '/referrals',
  /** One customer: `${paths.customers}/:customerId`. */
  customerDetail: '/customers/:customerId',
  scanner: '/scanner',
  cardStudio: '/card-studio',
  messages: '/messages',
  rewards: '/rewards',
  /** The customer's view of their loyalty card, previewed by loyalty code. */
  wallet: '/wallet',
  settings: '/settings',
  kyc: '/kyc',
  /** Public (no sign-in): a programme's join page behind its QR, and a member's card by loyalty code. */
  join: '/loyalty/join/:token',
  card: '/loyalty/progress/:code',
} as const

export const programPath = (id: string) => `${paths.loyalty}/${encodeURIComponent(id)}`
export const customerPath = (id: string) => `${paths.customers}/${encodeURIComponent(id)}`
export const cardPath = (code: string) => `/loyalty/progress/${encodeURIComponent(code)}`
/** Same paths as sink. The token holds a colon ("<program_id>:<signature>"), which is legal in a path, so it goes in raw. */
export const joinPath = (token: string) => `/loyalty/join/${token}`
