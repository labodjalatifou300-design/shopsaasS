'use client'

export function RemoveMemberButton({
  action,
  email,
}: {
  action: (formData: FormData) => void | Promise<void>
  email: string
}) {
  return (
    <form action={action}>
      <button
        type="submit"
        className="rounded-lg px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
        onClick={(event) => {
          if (!window.confirm(`Retirer ${email} de l’équipe ?`)) event.preventDefault()
        }}
      >
        Retirer
      </button>
    </form>
  )
}
