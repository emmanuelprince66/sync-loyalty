import { isDarkColour } from '@/api/storeTheme'
import { Download } from 'lucide-react'
import { CARD_COLOURS, Card, EmptyBlock, MkButton, PageHeading, inputClass, labelClass } from '@/components/ui/mk'
import { QrCodeImage } from '@/components/ui/QrCode'
import { cn } from '@/lib/cn'
import { TEMPLATES, useCardStudio } from './useCardStudio'

export default function CardStudioPage() {
  const { posterRef, ...s } = useCardStudio()
  return <div className="space-y-5">
    <PageHeading title="Card studio" subtitle="Design the in-store QR poster your customers scan to join."/>
    {!s.programsLoading && s.programs.length === 0
      ? <Card><EmptyBlock title="Create a loyalty program first" text="Each poster carries one program’s join QR."/></Card>
      : <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
        <Card className="p-5">
          <h3 className="text-sm font-black">Design settings</h3>
          <label className="mt-6 block"><span className={labelClass}>Program</span>
            <select value={s.programId} onChange={event => s.selectProgram(event.target.value)} className={cn(inputClass, 'mt-2')}>{s.programs.map(program => <option key={program.id} value={program.id}>{program.name}</option>)}</select>
          </label>
          <div className="mt-6"><p className={labelClass}>Template</p><div className="mt-2 grid grid-cols-3 gap-2">{TEMPLATES.map((item, index) => <button key={item} type="button" onClick={() => s.setTemplate(index)} className={cn('aspect-square p-2 text-[9px] font-extrabold', s.template === index ? 'bg-black text-white' : 'border border-black/10')}><span className={cn('mx-auto mb-2 block h-8 w-8 bg-[#D7FF45]', index === 1 && 'rounded-full', index === 2 && 'rotate-12')}/>{item}</button>)}</div></div>
          <div className="mt-6"><p className={labelClass}>Store colour</p><p className="mt-1 text-[10px] text-black/40">Your cards and storefront share this colour.</p><div className="mt-3 flex flex-wrap gap-2">{CARD_COLOURS.map(item => <button key={item} type="button" aria-label={`Colour ${item}`} onClick={() => s.setColour(item)} className={cn('h-9 w-9 border-2', s.colour === item ? 'border-black p-1' : 'border-transparent')}><i className="block h-full w-full" style={{ background: item }}/></button>)}</div></div>
          <label className="mt-6 block"><span className={labelClass}>Headline</span><input value={s.headline} onChange={event => s.setHeadline(event.target.value)} className={cn(inputClass, 'mt-2')}/></label>
          <MkButton onClick={() => { void s.exportPoster() }} loading={s.exporting} disabled={!s.joinUrl} className="mt-6 w-full"><Download size={14}/>Export poster</MkButton>
        </Card>
        <div className="grid place-items-center bg-black p-6 lg:p-10">
          <div ref={posterRef} className="w-full max-w-[560px] bg-white p-5 shadow-2xl">
            <div className={cn('p-7', isDarkColour(s.colour) && 'text-white')} style={{ background: s.colour }}>
              <div className="flex items-center justify-between gap-3"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-black text-sm font-black text-white">{s.businessInitials}</span><span className="truncate text-[10px] font-black uppercase">{s.businessName} × maheleKart</span></div>
              <h3 className={cn('mt-12 max-w-[380px] break-words text-4xl font-black leading-[.92] tracking-[-.07em] sm:text-5xl', s.template === 1 && 'mx-auto text-center', s.template === 2 && '-rotate-2')}>{s.headline}</h3>
              <p className={cn('mt-5 max-w-sm text-sm font-bold opacity-60', s.template === 1 && 'mx-auto text-center')}>{s.subline}</p>
              <div className="mt-10 flex items-end justify-between gap-5">
                <div><p className="text-xs font-black">SCAN TO JOIN</p><p className="mt-1 text-[9px] opacity-60">No app download. Your card opens instantly.</p></div>
                <div className="shrink-0 bg-white p-2">{s.qrImage ? <img src={s.qrImage} alt="Join QR code" crossOrigin="anonymous" className="h-28 w-28"/> : s.joinUrl ? <QrCodeImage value={s.joinUrl} size={112}/> : <div className="h-28 w-28 animate-pulse bg-[#ECECE8]"/>}</div>
              </div>
            </div>
          </div>
        </div>
      </div>}
  </div>
}
