import { Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { AppLoader } from '@/components/ui/AppLoader'
import { GuestOnly, RequireAuth, RequireBusiness, RequirePage } from './guards'
import { pages } from './pages'
import { paths } from './paths'

const { AuthPage, SelectBusinessPage, OverviewPage, LoyaltyPage, ProgramDetailPage, CustomersPage, CustomerDetailPage, ScannerPage, CardStudioPage, MessagesPage, RewardsPage, CustomerWalletPage, SettingsPage, SegmentsPage, InsightsPage, ReferralsPage, ImportCustomersPage, KycPage, JoinPage, MemberCardPage } = pages

const withLoader = (element: React.ReactNode) => <Suspense fallback={<AppLoader/>}>{element}</Suspense>

export const router = createBrowserRouter([
  // Public pages customers open from a QR or a shared link: no sign-in.
  { path: paths.join, element: withLoader(<JoinPage/>) },
  { path: paths.card, element: withLoader(<MemberCardPage/>) },
  {
    element: <GuestOnly/>,
    children: [
      { path: paths.login, element: <AuthPage/> },
      { path: paths.signup, element: <AuthPage/> },
    ],
  },
  // Onboarding steps after signup: the user is already signed in by then.
  { path: `${paths.signup}/:step`, element: withLoader(<AuthPage/>) },
  {
    element: <RequireAuth/>,
    children: [
      { path: paths.selectBusiness, element: <SelectBusinessPage/> },
      {
        element: <RequireBusiness/>,
        children: [{
          element: <AppLayout/>,
          children: [{
            element: <RequirePage/>,
            children: [
              { index: true, element: <OverviewPage/> },
              { path: paths.loyalty, element: <LoyaltyPage/> },
              { path: paths.programDetail, element: <ProgramDetailPage/> },
              { path: paths.customers, element: <CustomersPage/> },
              { path: paths.customerDetail, element: <CustomerDetailPage/> },
              { path: paths.scanner, element: <ScannerPage/> },
              { path: paths.cardStudio, element: <CardStudioPage/> },
              { path: paths.messages, element: <MessagesPage/> },
              { path: paths.rewards, element: <RewardsPage/> },
              { path: paths.wallet, element: <CustomerWalletPage/> },
              { path: paths.settings, element: <SettingsPage/> },
              { path: paths.segments, element: <SegmentsPage/> },
              { path: paths.insights, element: <InsightsPage/> },
              { path: paths.referrals, element: <ReferralsPage/> },
              { path: paths.importCustomers, element: <ImportCustomersPage/> },
              { path: paths.kyc, element: <KycPage/> },
            ],
          }],
        }],
      },
    ],
  },
  { path: '*', element: <Navigate to={paths.dashboard} replace/> },
])
