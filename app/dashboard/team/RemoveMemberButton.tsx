'use client'

export function RemoveMemberButton({
  action,
  email,
}: {
  action: (...args: any[]) => any
  email: string
}) {
  const voidAction = async (fd: FormData): Promise<void> => { await action(fd) }

  return (
    <form action={voidAction}>
      <button
        type="submit"
        className="rounded-lg px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
        onClick={(event) => {
          if (!window.confirm(`Retirer ${email} de l'équipe ?`)) event.preventDefault()
        }}
      >
        Retirer
      </button>
    </form>
  )
}
