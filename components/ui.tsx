import { cn } from '@/lib/utils'

const inputBase =
  'w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-zinc-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 disabled:bg-zinc-50 disabled:text-zinc-500'

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputBase, props.className)} />
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(inputBase, 'min-h-24', props.className)} />
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(inputBase, 'pr-8', props.className)} />
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-zinc-700">{label}</span>
      {children}
      {hint && <span className="block text-xs text-zinc-500">{hint}</span>}
    </label>
  )
}

export function Checkbox({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="flex items-center gap-2 text-sm text-zinc-700">
      <input type="checkbox" {...props} className="size-4 rounded border-zinc-300 accent-violet-600" />
      {label}
    </label>
  )
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm', className)}>{children}</div>
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  )
}

const badgeColors = {
  violet: 'bg-violet-50 text-violet-700 ring-violet-200',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  zinc: 'bg-zinc-100 text-zinc-600 ring-zinc-200',
  orange: 'bg-amber-50 text-amber-700 ring-amber-200',
} as const

export function Badge({ children, color = 'zinc' }: { children: React.ReactNode; color?: keyof typeof badgeColors }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', badgeColors[color])}>
      {children}
    </span>
  )
}

export const buttonStyles = {
  primary: 'bg-violet-600 text-white hover:bg-violet-700 shadow-sm',
  secondary: 'bg-white text-zinc-800 ring-1 ring-inset ring-zinc-200 hover:bg-zinc-50',
  danger: 'bg-white text-red-600 ring-1 ring-inset ring-red-200 hover:bg-red-50',
  ghost: 'text-zinc-600 hover:bg-zinc-100',
} as const

export type ButtonVariant = keyof typeof buttonStyles

export function buttonClass(variant: ButtonVariant = 'primary', className?: string) {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60',
    buttonStyles[variant],
    className,
  )
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-14 text-center">
      <p className="font-medium">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-zinc-500">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
