import type { ReactNode } from 'react'
import { Logo } from '@/components/ui/Logo'
import { cn } from '@/lib/cn'
import { SETUP_STAGES } from '../constants'
import { AuthVisual } from './AuthVisual'

type AuthLayoutProps = {
  /** Index into the 3 onboarding steps, or -1 to hide the progress bar. */
  setupStep: number
  /** Small orange label above the heading. */
  eyebrow: string
  heading: string
  subtitle: string
  children: ReactNode
}

/** The design's auth shell: dark story panel + light form side holding a white card. */
export function AuthLayout({ setupStep, eyebrow, heading, subtitle, children }: AuthLayoutProps) {
  return <div className="auth-screen grid min-h-screen bg-[#F6F6F2] lg:grid-cols-[minmax(340px,.8fr)_minmax(450px,1fr)] lg:bg-[#000000] xl:grid-cols-[minmax(380px,.9fr)_minmax(520px,1.1fr)]">
    <AuthVisual/>
    {/* Auto margins center the card both ways and never clip it when it is taller than the screen. */}
    <main className="flex min-h-screen w-full min-w-0 flex-col bg-[#F6F6F2] px-[18px] py-[30px] sm:px-10 lg:p-[50px]">
      <div className="mb-[25px] lg:hidden"><Logo/></div>
      <div className="m-auto w-full max-w-[430px] rounded-2xl border border-[#E3E3DF] bg-white px-6 py-7 shadow-[0_18px_55px_rgba(30,30,30,0.06)] sm:p-10">
        {setupStep >= 0 && <div className="mb-6 flex gap-2">{SETUP_STAGES.map((item, index) => <span key={item} className={cn('h-1.5 flex-1 rounded-full', index <= setupStep ? 'bg-secondary' : 'bg-[#E3E3DF]')}/>)}</div>}
        <div>
          <span className="text-[9px] font-extrabold uppercase tracking-[0.08em] text-[#000000]">{eyebrow}</span>
          <h1 className="mb-[5px] mt-[7px] text-[24px] font-normal leading-tight text-[#000000]">{heading}</h1>
          <p className="text-[10px] leading-4 text-[#66665F]">{subtitle}</p>
        </div>
        {children}
      </div>
    </main>
  </div>
}
