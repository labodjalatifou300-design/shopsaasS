import { Crown } from 'lucide-react'
import { requirePerm } from '@/lib/context'
import { Badge, Card, PageHeader } from '@/components/ui'
import { removeMember } from './actions'
import { InviteForm } from './InviteForm'
import { RemoveMemberButton } from './RemoveMemberButton'

type Member = {
  user_id: string
  email: string
  full_name: string | null
  role_id: string
  created_at: string
}

export default async function TeamPage() {
  const { supabase, store, user } = await requirePerm('team.write')

  const [members, roles, markets] = await Promise.all([
    supabase
      .from('store_members')
      .select('user_id, email, full_name, role_id, created_at')
      .eq('store_id', store.id)
      .order('created_at'),
    supabase
      .from('roles')
      .select('id, key, name, description')
      .eq('store_id', store.id)
      .order('created_at'),
    supabase
      .from('markets')
      .select('id, name')
      .eq('store_id', store.id)
      .eq('active', true)
      .order('name'),
  ])

  const roleList = (roles.data ?? []) as { id: string; key: string | null; name: string; description: string | null }[]
  const roleById = new Map(roleList.map((r) => [r.id, r]))
  const assignable = roleList.filter((r) => r.key !== 'owner')
  const memberList = (members.data ?? []) as Member[]

  return (
    <>
      <PageHeader
        title="Équipe"
        subtitle={`${memberList.length} membre${memberList.length > 1 ? 's' : ''} · ${store.name}`}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">

        {/* ── Liste des membres ── */}
        <Card className="p-0">
          <div className="border-b border-zinc-100 px-5 py-4">
            <h2 className="font-semibold">Membres</h2>
          </div>
          <ul className="divide-y divide-zinc-100">
            {memberList.map((m) => {
              const role = roleById.get(m.role_id)
              const isOwner = role?.key === 'owner'
              const isMe = m.user_id === user.id
              return (
                <li key={m.user_id} className="flex items-center justify-between gap-3 px-5 py-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-zinc-800">
                      {m.full_name || m.email}
                      {isMe && <span className="ml-1.5 text-xs text-zinc-400">(toi)</span>}
                    </p>
                    <p className="truncate text-sm text-zinc-500">{m.email}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge color={isOwner ? 'violet' : 'zinc'}>
                      {isOwner && <Crown className="mr-1 size-3" />}
                      {role?.name ?? '—'}
                    </Badge>
                    {!isOwner && !isMe && (
                      <RemoveMemberButton
                        action={removeMember.bind(null, m.user_id, undefined as any)}
                        email={m.email}
                      />
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>

        {/* ── Ajouter un membre ── */}
        <Card>
          <h2 className="mb-1 font-semibold">Inviter quelqu’un</h2>
          <p className="mb-4 text-sm text-zinc-500">
            Choisis un rôle et partage le lien. La personne se connecte ou crée elle-même un compte avec cette adresse email.
          </p>
          <InviteForm
            roles={assignable}
            markets={(markets.data ?? []).map((market: any) => ({ id: market.id, name: market.name }))}
            storeName={store.name}
          />
        </Card>
      </div>
    </>
  )
}
