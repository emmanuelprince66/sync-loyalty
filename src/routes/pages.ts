import { lazy } from 'react'

/** Page modules, split per route. Import functions are kept so pages can be warmed up before they're needed. */
const loaders = {
  auth: () => import('@/features/auth/AuthPage'),
  selectBusiness: () => import('@/features/business/SelectBusinessPage'),
  overview: () => import('@/features/overview/OverviewPage'),
  loyalty: () => import('@/features/loyalty/LoyaltyPage'),
  programDetail: () => import('@/features/loyalty/ProgramDetailPage'),
  customers: () => import('@/features/customers/CustomersPage'),
  customerDetail: () => import('@/features/customers/CustomerDetailPage'),
  scanner: () => import('@/features/scanner/ScannerPage'),
  cardStudio: () => import('@/features/card-studio/CardStudioPage'),
  messages: () => import('@/features/messages/MessagesPage'),
  rewards: () => import('@/features/rewards/RewardsPage'),
  wallet: () => import('@/features/wallet/CustomerWalletPage'),
  settings: () => import('@/features/settings/SettingsPage'),
  segments: () => import('@/features/segments/SegmentsPage'),
  insights: () => import('@/features/insights/InsightsPage'),
  referrals: () => import('@/features/referrals/ReferralsPage'),
  referralProgramme: () => import('@/features/referrals/ReferralProgrammePage'),
  importCustomers: () => import('@/features/customers/ImportCustomersPage'),
  kyc: () => import('@/features/kyc/KycPage'),
  plan: () => import('@/features/plan/PlanPage'),
  join: () => import('@/features/public/JoinPage'),
  card: () => import('@/features/public/MemberCardPage'),
}

export const pages = {
  AuthPage: lazy(loaders.auth),
  SelectBusinessPage: lazy(loaders.selectBusiness),
  OverviewPage: lazy(loaders.overview),
  LoyaltyPage: lazy(loaders.loyalty),
  ProgramDetailPage: lazy(loaders.programDetail),
  CustomersPage: lazy(loaders.customers),
  CustomerDetailPage: lazy(loaders.customerDetail),
  ScannerPage: lazy(loaders.scanner),
  CardStudioPage: lazy(loaders.cardStudio),
  MessagesPage: lazy(loaders.messages),
  RewardsPage: lazy(loaders.rewards),
  CustomerWalletPage: lazy(loaders.wallet),
  SettingsPage: lazy(loaders.settings),
  SegmentsPage: lazy(loaders.segments),
  InsightsPage: lazy(loaders.insights),
  ReferralsPage: lazy(loaders.referrals),
  ReferralProgrammePage: lazy(loaders.referralProgramme),
  ImportCustomersPage: lazy(loaders.importCustomers),
  KycPage: lazy(loaders.kyc),
  PlanPage: lazy(loaders.plan),
  JoinPage: lazy(loaders.join),
  MemberCardPage: lazy(loaders.card),
}

/** Downloads the app's pages in the background, ignoring failures, so navigating never waits on code. */
export const preloadAppShell = () => {
  for (const load of Object.values(loaders)) load().catch(() => undefined)
}
