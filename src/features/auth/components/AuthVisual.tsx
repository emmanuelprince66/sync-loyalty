import { Logo } from '@/components/ui/Logo'
import { AUTH_PROOF } from '../constants'

/** Story panel on the left of every auth screen (desktop only), from the design's .auth-story. */
export function AuthVisual() {
  return <section className="auth-gradient hidden min-h-screen flex-col px-8 py-8 text-white lg:sticky lg:top-0 lg:flex lg:h-screen xl:px-[45px] xl:py-[34px]">
    <Logo inverse/>
    <div className="my-auto max-w-[520px] py-10">
      <span className="inline-flex w-max items-center gap-1.5 rounded-full bg-[#D7FF45] px-2 py-1 text-[9px] font-bold text-black">Loyalty for every business</span>
      <h1 className="mb-[13px] mt-4 text-[clamp(36px,4vw,57px)] font-normal leading-[1.02] tracking-[-1.8px]">Loyalty that moves people.</h1>
      <p className="max-w-[460px] text-[13px] leading-[1.65] text-[#C7C7C7]">Turn occasional customers into regulars with visit streaks, spend rewards and messages that bring people back.</p>
      <div className="mt-[45px] grid grid-cols-3 gap-4 border-t border-[#4D4D4D] pt-[25px]">
        {AUTH_PROOF.map(item => <div key={item.label} className="flex flex-col">
          <strong className="text-[22px] font-bold text-[#D7FF45]">{item.value}</strong>
          <span className="text-[9px] leading-snug text-[#AAAAAA]">{item.label}</span>
        </div>)}
      </div>
    </div>
    <div className="border-t border-[#444444] pt-[22px]">
      <p className="mb-[5px] max-w-[420px] text-[11px] text-[#D1D1D1]">“Know who keeps coming back — and reward them for it.”</p>
      <span className="text-[9px] text-[#8F8F8F]">maheleKart</span>
    </div>
  </section>
}
