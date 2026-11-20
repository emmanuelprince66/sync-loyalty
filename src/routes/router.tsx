import { Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { AppLoader } from '@/components/ui/AppLoader'
import { GuestOnly, RequireAuth, RequireBusiness, RequirePage } from './guards'
import { pages } from './pages'
import { paths } from './paths'

const { AuthPage, SelectBusinessPage, OverviewPage, LoyaltyPage, ProgramDetailPage, CustomersHubPage, CustomerDetailPage, ScannerPage, MessagesPage, CustomerWalletPage, SettingsPage, ReferralsPage, ReferralProgrammePage, ImportCustomersPage, PlanPage, JoinPage, MemberCardPage } = pages

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
              // Customers with a Segments tab (?tab=segments).
              { path: paths.customers, element: <CustomersHubPage/> },
              { path: paths.customerDetail, element: <CustomerDetailPage/> },
              { path: paths.scanner, element: <ScannerPage/> },
              // Card studio is switched off: sink has none; the join card lives on each programme (QR) and takes the store colour.
              // { path: paths.cardStudio, element: <CardStudioPage/> },
              { path: paths.messages, element: <MessagesPage/> },
              // Rewards and Insights are tabs on Loyalty now; Segments is a tab on Customers. Old links still land there.
              { path: paths.rewards, element: <Navigate to={`${paths.loyalty}?tab=rewards`} replace/> },
              { path: paths.wallet, element: <CustomerWalletPage/> },
              { path: paths.settings, element: <SettingsPage/> },
              { path: paths.segments, element: <Navigate to={`${paths.customers}?tab=segments`} replace/> },
              { path: paths.insights, element: <Navigate to={`${paths.loyalty}?tab=insights`} replace/> },
              { path: paths.referrals, element: <ReferralsPage/> },
              { path: paths.referralProgramme, element: <ReferralProgrammePage/> },
              { path: paths.importCustomers, element: <ImportCustomersPage/> },
              // KYC is switched off in maheleKart for now (commented out, not deleted).
              // { path: paths.kyc, element: <KycPage/> },
              { path: paths.plan, element: <PlanPage/> },
            ],
          }],
        }],
      },
    ],
  },
  { path: '*', element: <Navigate to={paths.dashboard} replace/> },
])
