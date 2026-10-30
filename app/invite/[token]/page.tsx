import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ActionForm, SubmitButton } from '@/components/form'
import { buttonClass } from '@/components/ui'
import { acceptInvitation } from './actions'

type Invite = { store_name: string; role_name: string; email: string; expired: boolean; accepted: boolean }

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()
  const [{ data }, { data: auth }] = await Promise.all([supabase.rpc('get_invitation', { p_token: token }), supabase.auth.getUser()])
  const invite = (Array.isArray(data) ? data[0] : data) as Invite | undefined
  const user = auth.user
  const next = `/invite/${token}`

  let body: React.ReactNode
  if (!invite) body = <p className="text-sm text-zinc-500">Ce lien d’invitation n’existe pas.</p>
  else if (invite.accepted) body = <p className="text-sm text-zinc-500">Cette invitation a déjà été utilisée.</p>
  else if (invite.expired) body = <p className="text-sm text-zinc-500">Cette invitation a expiré. Demande un nouveau lien.</p>
  else if (!user)
    body = (
      <div className="space-y-3">
        <p className="text-sm text-zinc-600">
          Crée ton compte (ou connecte-toi) avec <strong>{invite.email}</strong> pour rejoindre l’équipe.
        </p>
        <Link href={`/signup?next=${encodeURIComponent(next)}`} className={buttonClass('primary', 'w-full')}>
          Créer mon compte
        </Link>
        <Link href={`/login?next=${encodeURIComponent(next)}`} className={buttonClass('secondary', 'w-full')}>
          J’ai déjà un compte
        </Link>
      </div>
    )
  else
    body = (
      <ActionForm action={acceptInvitation.bind(null, token)} className="space-y-3">
        <p className="text-sm text-zinc-600">
          Connecté en tant que <strong>{user.email}</strong>.
        </p>
        <SubmitButton className="w-full" pendingLabel="Un instant…">
          Rejoindre {invite.store_name}
        </SubmitButton>
      </ActionForm>
    )

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 px-4">
      <div className="w-full max-w-sm rounded-3xl border border-zinc-200 bg-white p-7 shadow-xl shadow-zinc-200/50">
        {invite && (
          <>
            <p className="text-xs font-medium uppercase tracking-wide text-violet-600">Invitation</p>
            <h1 className="mt-1 text-xl font-semibold">{invite.store_name}</h1>
            <p className="mt-1 mb-6 text-sm text-zinc-500">Rôle : {invite.role_name}</p>
          </>
        )}
        {body}
      </div>
    </div>
  )
}
