export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-violet-600 text-lg font-bold text-white shadow-lg shadow-violet-200">
            S
          </span>
        </div>
        <div className="rounded-3xl border border-zinc-200 bg-white p-7 shadow-xl shadow-zinc-200/50">{children}</div>
      </div>
    </div>
  )
}
