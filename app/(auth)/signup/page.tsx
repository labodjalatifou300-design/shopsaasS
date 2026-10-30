import Link from 'next/link'
import { ActionForm, SubmitButton } from '@/components/form'
import { Field, Input } from '@/components/ui'
import { signup } from '../actions'

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  return (
    <>
      <h1 className="text-xl font-semibold">Créer un compte</h1>
      <p className="mt-1 text-sm text-zinc-500">Ta boutique est prête en deux minutes.</p>
      <ActionForm action={signup} className="mt-6 space-y-4">
        <input type="hidden" name="next" value={next ?? ''} />
        <Field label="Nom complet">
          <Input name="full_name" autoComplete="name" required />
        </Field>
        <Field label="Email">
          <Input name="email" type="email" autoComplete="email" required />
        </Field>
        <Field label="Mot de passe" hint="8 caractères minimum">
          <Input name="password" type="password" autoComplete="new-password" minLength={8} required />
        </Field>
        <SubmitButton className="w-full" pendingLabel="Création…">
          Créer mon compte
        </SubmitButton>
      </ActionForm>
      <p className="mt-6 text-center text-sm text-zinc-500">
        Déjà inscrit ?{' '}
        <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ''}`} className="font-medium text-violet-700">
          Se connecter
        </Link>
      </p>
    </>
  )
}
