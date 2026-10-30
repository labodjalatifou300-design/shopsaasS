'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import type { FormState } from '@/lib/form'
import { buttonClass, type ButtonVariant } from '@/components/ui'

type Action = (state: FormState, formData: FormData) => Promise<FormState>

/** Formulaire branché sur une Server Action, affiche erreurs et messages */
export function ActionForm({
  action,
  children,
  className,
}: {
  action: Action
  children: React.ReactNode
  className?: string
}) {
  const [state, formAction] = useActionState(action, undefined)
  return (
    <form action={formAction} className={className}>
      {children}
      <FormFeedback state={state} />
    </form>
  )
}

export function FormFeedback({ state }: { state: FormState }) {
  if (!state) return null
  return (
    <>
      {state.error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      {state.message && <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{state.message}</p>}
    </>
  )
}

export function SubmitButton({
  children,
  variant = 'primary',
  className,
  confirm,
  pendingLabel = 'Enregistrement…',
}: {
  children: React.ReactNode
  variant?: ButtonVariant
  className?: string
  confirm?: string
  pendingLabel?: string
}) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className={buttonClass(variant, className)}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault()
      }}
    >
      {pending ? pendingLabel : children}
    </button>
  )
}
