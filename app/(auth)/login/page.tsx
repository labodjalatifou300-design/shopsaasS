import Link from 'next/link'
import { ActionForm, SubmitButton } from '@/components/form'
import { Field, Input } from '@/components/ui'
import { login } from '../actions'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  return (
    <>
      <h1 className="text-xl font-semibold">Connexion</h1>
      <p className="mt-1 text-sm text-zinc-500">Content de te revoir.</p>
      <ActionForm action={login} className="mt-6 space-y-4">
        <input type="hidden" name="next" value={next ?? ''} />
        <Field label="Email">
          <Input name="email" type="email" autoComplete="email" required />
        </Field>
        <Field label="Mot de passe">
          <Input name="password" type="password" autoComplete="current-password" required />
        </Field>
        <SubmitButton className="w-full" pendingLabel="Connexion…">
          Se connecter
        </SubmitButton>
      </ActionForm>
      <p className="mt-6 text-center text-sm text-zinc-500">
        Pas de compte ?{' '}
        <Link href={`/signup${next ? `?next=${encodeURIComponent(next)}` : ''}`} className="font-medium text-violet-700">
          Créer un compte
        </Link>
      </p>
    </>
  )
}
