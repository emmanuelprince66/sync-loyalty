import { useState } from 'react'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { programEditFrom, toEditPayload, useUpdateProgram, type LoyaltyProgram, type ProgramEdit } from '@/api/loyalty'

/** sink's Edit Campaign form state (AddLoyaltyProgram with editData): opened from the list card or the detail page. */
export function useProgramEditor() {
  const update = useUpdateProgram()
  const [target, setTarget] = useState<{ id: string; edit: ProgramEdit } | null>(null)
  return {
    editing: target?.edit ?? null,
    openEdit: (program: LoyaltyProgram) => setTarget({ id: program.id, edit: programEditFrom(program) }),
    changeEdit: (patch: Partial<ProgramEdit>) => setTarget(current => (current ? { ...current, edit: { ...current.edit, ...patch } } : current)),
    closeEdit: () => setTarget(null),
    saving: update.isPending,
    saveEdit: () => {
      if (!target) return
      const editing = target.edit
      if (!editing.name.trim()) return toast.error('Give the program a name.')
      if (editing.conditions.some(condition => !(Number(condition.threshold) > 0))) return toast.error('Enter the target for each condition.')
      update.mutate({ id: target.id, patch: toEditPayload(editing) }, {
        onSuccess: () => { toast.success('Program updated'); setTarget(null) },
        onError: error => toast.error(errorMessage(error, 'Could not save the changes.')),
      })
    },
  }
}

export type ProgramEditor = ReturnType<typeof useProgramEditor>
