import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getContext } from '@/lib/context'
import { StoreForm } from './StoreForm'

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const { new: isNew } = await searchParams
  const { memberships } = await getContext()
  if (memberships.length > 0 && !isNew) redirect('/dashboard')

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-7 shadow-xl shadow-zinc-200/50">
        <h1 className="text-xl font-semibold">Créons ta boutique</h1>
        <p className="mt-1 mb-6 text-sm text-zinc-500">Nom, adresse et pays de vente. La devise et les réglages de base se configurent automatiquement.</p>
        <StoreForm />
        {memberships.length > 0 && (
          <Link href="/dashboard" className="mt-4 block text-center text-sm text-zinc-500 hover:text-zinc-800">
            Retour au tableau de bord
          </Link>
        )}
      </div>
    </div>
  )
}
