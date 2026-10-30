'use client'

import { ActionForm, SubmitButton } from '@/components/form'
import { Checkbox, Field, Input } from '@/components/ui'
import { PERMISSION_GROUPS } from '@/lib/permissions'
import type { FormState } from '@/lib/form'

export function RoleForm({
  action,
  initial,
  submitLabel,
}: {
  action: (s: FormState, fd: FormData) => Promise<FormState>
  initial?: { name: string; description: string | null; permissions: string[] }
  submitLabel: string
}) {
  return (
    <ActionForm action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom du rôle">
          <Input name="name" defaultValue={initial?.name} placeholder="Ex : Closeuse Bénin" required />
        </Field>
        <Field label="Description">
          <Input name="description" defaultValue={initial?.description ?? ''} placeholder="Ce que fait ce rôle" />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PERMISSION_GROUPS.map((g) => (
          <div key={g.module} className="rounded-xl border border-zinc-200 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">{g.module}</p>
            <div className="space-y-2">
              {g.items.map((p) => (
                <Checkbox key={p.key} name="perm" value={p.key} label={p.label} defaultChecked={initial?.permissions.includes(p.key) ?? false} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <SubmitButton>{submitLabel}</SubmitButton>
    </ActionForm>
  )
}
