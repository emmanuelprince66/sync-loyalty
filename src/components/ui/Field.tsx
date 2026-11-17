import type { InputHTMLAttributes, ReactNode, Ref } from 'react'
import { cn } from '@/lib/cn'

type FieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  label: string
  suffix?: string
  hint?: string
  error?: string
  /** Element rendered at the end of the input box (e.g. the password eye button). */
  endAdornment?: ReactNode
  /** Controlled usage: receives the raw string value. */
  onValueChange?: (value: string) => void
  ref?: Ref<HTMLInputElement>
}

/**
 * Labelled text input from the design. Use it controlled (value + onValueChange)
 * or with react-hook-form (`{...register('name')}`).
 */
export function Field({ label, suffix, hint, error, endAdornment, onValueChange, onChange, className, type = 'text', id, name, ref, ...props }: FieldProps) {
  const inputId = id ?? (name ? `field-${name}` : undefined)
  return <label className={cn('block', className)} htmlFor={inputId}>
    <span data-ff="label" className="mb-2 block text-[12px] font-extrabold text-[#2B2B28]">{label}</span>
    <span data-ff="box" className={cn('flex h-12 items-center rounded-xl border border-[#D9D9D4] bg-white px-3.5 transition focus-within:border-[#000000] focus-within:ring-4 focus-within:ring-[#000000]/10', error && 'border-[#E52929] focus-within:border-[#E52929] focus-within:ring-[#E52929]/10')}>
      <input
        ref={ref}
        id={inputId}
        name={name}
        type={type}
        aria-invalid={error ? true : undefined}
        onChange={event => { onChange?.(event); onValueChange?.(event.target.value) }}
        data-ff="input"
        className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#000000] outline-none placeholder:font-medium placeholder:text-[#66665F]"
        {...props}
      />
      {suffix && <span className="ml-2 text-xs font-bold text-[#66665F]">{suffix}</span>}
      {endAdornment}
    </span>
    {error
      ? <span role="alert" className="mt-1.5 block text-[11px] font-semibold text-[#C72D34]">{error}</span>
      : hint && <span className="mt-1.5 block text-[11px] text-[#66665F]">{hint}</span>}
  </label>
}
