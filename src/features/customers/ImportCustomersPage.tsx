import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle2, Download, FileSpreadsheet, UploadCloud, X } from 'lucide-react'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { requireBusinessId } from '@/api/business'
import { apiFormRequest } from '@/api/http'
import { queryKeys } from '@/api/query-keys'
import { Card, MkButton, PageHeading } from '@/components/ui/mk'
import { cn } from '@/lib/cn'
import { paths } from '@/routes/paths'

type Row = { name: string; phone: string; email: string; gender: string; date_of_birth: string }
type RowError = { row: number; field: string; message: string }

const REQUIRED = ['name', 'phone']

/** sink's useUploadCustomerCsvHook checks, before anything is sent. */
const validate = (rows: Row[], headers: string[]): RowError[] => {
  const errors: RowError[] = []
  const missing = REQUIRED.filter(column => !headers.includes(column))
  if (missing.length) errors.push({ row: 0, field: 'headers', message: `Missing column${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}` })
  rows.forEach((row, index) => {
    if (!row.name.trim()) errors.push({ row: index + 1, field: 'name', message: 'Name is required' })
    if (!row.phone.trim()) errors.push({ row: index + 1, field: 'phone', message: 'Phone is required' })
    if (row.gender && !['MALE', 'FEMALE', 'OTHER'].includes(row.gender)) errors.push({ row: index + 1, field: 'gender', message: 'Use MALE, FEMALE or OTHER' })
    if (row.date_of_birth && !/^\d{4}-\d{2}-\d{2}$/.test(row.date_of_birth)) errors.push({ row: index + 1, field: 'date_of_birth', message: 'Use YYYY-MM-DD' })
  })
  return errors
}

const parse = async (file: File): Promise<{ rows: Row[]; headers: string[] }> => {
  let records: Record<string, unknown>[]
  if (/\.csv$/i.test(file.name)) {
    const Papa = (await import('papaparse')).default
    records = await new Promise((resolve, reject) => Papa.parse<Record<string, unknown>>(file, { header: true, skipEmptyLines: true, complete: result => resolve(result.data), error: reject }))
  } else {
    const XLSX = await import('xlsx')
    const workbook = XLSX.read(new Uint8Array(await file.arrayBuffer()), { type: 'array' })
    records = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[workbook.SheetNames[0]])
  }
  const headers = records.length ? Object.keys(records[0]).map(key => key.trim().toLowerCase()) : []
  const rows = records.map(record => {
    const get = (key: string) => String(Object.entries(record).find(([name]) => name.trim().toLowerCase() === key)?.[1] ?? '').trim()
    return { name: get('name'), phone: get('phone'), email: get('email'), gender: get('gender').toUpperCase(), date_of_birth: get('date_of_birth') }
  })
  return { rows, headers }
}

const downloadTemplate = () => {
  const csv = ['name,phone,email,gender,date_of_birth', 'John Doe,+2348031234567,john@example.com,MALE,1990-04-12', 'Ada Obi,+2348059876543,,FEMALE,1988-11-03'].join('\n')
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
  link.download = 'customer_upload_template.csv'
  link.click()
  URL.revokeObjectURL(link.href)
}

/** sink's customers/upload: check the file here, then send it as is to POST customer/bulk_upload/{business_id}/ (field "file"). */
export default function ImportCustomersPage() {
  const navigate = useNavigate()
  const client = useQueryClient()
  const input = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [rows, setRows] = useState<Row[]>([])
  const [errors, setErrors] = useState<RowError[]>([])
  const [reading, setReading] = useState(false)
  const [dragging, setDragging] = useState(false)

  const upload = useMutation({
    mutationFn: (picked: File) => { const form = new FormData(); form.append('file', picked); return apiFormRequest<unknown>(`customer/bulk_upload/${requireBusinessId()}/`, 'POST', form) },
    onSuccess: () => { void client.invalidateQueries({ queryKey: queryKeys.customers }); toast.success(`${rows.length} customers uploaded`); navigate(paths.customers) },
    onError: error => toast.error(errorMessage(error, 'Could not upload the customers.')),
  })

  const pick = async (picked: File | undefined) => {
    if (!picked) return
    if (!/\.(csv|xlsx|xls)$/i.test(picked.name)) return toast.error('Upload a CSV or Excel file.')
    setFile(picked); setReading(true)
    try {
      const parsed = await parse(picked)
      setRows(parsed.rows)
      setErrors(parsed.rows.length === 0 ? [{ row: 0, field: 'file', message: 'The file has no customers in it.' }] : validate(parsed.rows, parsed.headers))
    } catch {
      setRows([]); setErrors([{ row: 0, field: 'file', message: 'We couldn’t read this file. Check it is a valid CSV or Excel file.' }])
    } finally { setReading(false) }
  }
  const reset = () => { setFile(null); setRows([]); setErrors([]); if (input.current) input.current.value = '' }
  const cellError = (index: number, field: string) => errors.some(error => error.row === index + 1 && error.field === field)
  const fileErrors = errors.filter(error => error.row === 0)

  return <div className="space-y-5">
    <button type="button" onClick={() => navigate(paths.customers)} className="inline-flex items-center gap-2 rounded-full border border-black/15 bg-white py-2 pl-2 pr-4 text-xs font-extrabold transition hover:border-black"><span className="grid h-6 w-6 place-items-center rounded-full bg-black text-white"><ArrowLeft size={13}/></span>Customers</button>
    <PageHeading badge="IMPORT" title="Bring your customers in." subtitle="Upload a CSV or Excel file. We check it before anything is saved." actions={<MkButton secondary onClick={downloadTemplate}><Download size={14}/>Download template</MkButton>}/>

    {!file ? <Card className="p-6">
      <div onDragOver={event => { event.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); void pick(event.dataTransfer.files[0]) }} className={cn('flex flex-col items-center border-2 border-dashed px-6 py-16 text-center transition', dragging ? 'border-black bg-[#D7FF45]/30' : 'border-black/15 bg-[#FAFAF7]')}>
        <span className="grid h-14 w-14 place-items-center rounded-full bg-black text-[#D7FF45]"><UploadCloud size={24}/></span>
        <h3 className="mt-5 text-lg font-black">{dragging ? 'Drop your file here' : 'Drag and drop your file here'}</h3>
        <p className="mt-1 text-xs text-black/45">or</p>
        <MkButton className="mt-3" onClick={() => input.current?.click()}>Browse files</MkButton>
        <input ref={input} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={event => { void pick(event.target.files?.[0]) }}/>
        <p className="mt-6 text-[11px] text-black/50">Columns: <b>name</b>, <b>phone</b>, email, gender (MALE, FEMALE, OTHER), date_of_birth (YYYY-MM-DD). Name and phone are required.</p>
      </div>
    </Card>
      : <Card className="overflow-hidden">
        <div className="flex flex-col justify-between gap-3 border-b border-black/10 p-5 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#F0F0EC]"><FileSpreadsheet size={17}/></span><div className="min-w-0"><b className="block truncate text-sm">{file.name}</b><span className="text-[11px] text-black/45">{reading ? 'Reading…' : `${rows.length.toLocaleString()} customers`}</span></div></div>
          <div className="flex items-center gap-2">
            {!reading && (errors.length === 0 ? <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#237A49]"><CheckCircle2 size={15}/>Ready to upload</span> : <span className="text-xs font-extrabold text-[#B43A16]">{errors.length} to fix</span>)}
            <MkButton secondary onClick={reset}><X size={14}/>Change file</MkButton>
            <MkButton onClick={() => upload.mutate(file)} loading={upload.isPending} disabled={reading || errors.length > 0}>Upload {rows.length.toLocaleString()}</MkButton>
          </div>
        </div>
        {fileErrors.length > 0 && <div className="space-y-1 bg-[#FFE6DD] px-5 py-3">{fileErrors.map(error => <p key={error.message} className="text-xs font-bold text-[#B43A16]">{error.message}</p>)}</div>}
        {rows.length > 0 && <div className="max-h-[60vh] overflow-auto"><table className="w-full min-w-[640px] text-left text-xs">
          <thead className="sticky top-0 bg-[#F7F7F4] text-[10px] uppercase tracking-wider text-black/45"><tr><th className="px-5 py-3">#</th><th>Name</th><th>Phone</th><th>Email</th><th>Gender</th><th>Birthday</th></tr></thead>
          <tbody>{rows.slice(0, 500).map((row, index) => <tr key={index} className="border-t border-black/10">
            <td className="px-5 py-2.5 text-black/40">{index + 1}</td>
            {(['name', 'phone', 'email', 'gender', 'date_of_birth'] as const).map(field => <td key={field} className={cn('py-2.5 pr-3', cellError(index, field) && 'bg-[#FFE6DD] font-bold text-[#B43A16]')}>{row[field] || (cellError(index, field) ? 'Missing' : '—')}</td>)}
          </tr>)}</tbody>
        </table>{rows.length > 500 && <p className="p-4 text-center text-[11px] text-black/45">Showing the first 500 of {rows.length.toLocaleString()}.</p>}</div>}
      </Card>}
  </div>
}
