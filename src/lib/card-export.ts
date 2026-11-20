/**
 * Saving a card as a picture or printing it (html2canvas-pro, as sink does). Shared by the business's
 * join card and the customer's own loyalty card, so both export the same way.
 */
const render = async (element: HTMLElement) => {
  const { default: html2canvas } = await import('html2canvas-pro')
  return html2canvas(element, { scale: 3, backgroundColor: null, logging: false })
}

/** Downloads the element as a PNG. */
export const downloadElementPng = async (element: HTMLElement | null, fileName: string) => {
  if (!element) throw new Error('Nothing to export')
  const canvas = await render(element)
  const link = document.createElement('a')
  link.download = fileName
  link.href = canvas.toDataURL('image/png')
  document.body.appendChild(link)
  link.click()
  link.remove()
}

/** Prints the element alone, centred on the page, from a hidden frame (no pop-up for the browser to block). */
export const printElement = async (element: HTMLElement | null, title: string) => {
  if (!element) throw new Error('Nothing to print')
  const image = (await render(element)).toDataURL('image/png')
  const frame = document.createElement('iframe')
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'
  document.body.appendChild(frame)
  const doc = frame.contentWindow?.document
  if (!doc) { frame.remove(); throw new Error('No frame') }
  doc.open()
  doc.write(`<!doctype html><title>${title.replace(/</g, '')}</title><style>@page{margin:12mm}html,body{margin:0;height:100%;display:flex;align-items:center;justify-content:center}img{width:340px;max-width:100%}</style><img src="${image}" onload="setTimeout(function(){window.focus();window.print()},50)">`)
  doc.close()
  setTimeout(() => frame.remove(), 60_000)
}

/** A safe file name from a label. */
export const fileNameFrom = (label: string, suffix: string) => `${(label || 'loyalty').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '')}_${suffix}.png`
