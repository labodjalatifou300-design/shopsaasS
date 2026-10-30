'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronDown, Check } from 'lucide-react'

const STATUS_LABELS: Record<string, string> = {
  new: 'Nouvelle',
  confirmed: 'Confirmée',
  unreachable: 'Injoignable',
  scheduled: 'Programmée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
  returned: 'Retournée',
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-violet-100 text-violet-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  unreachable: 'bg-orange-100 text-orange-700',
  scheduled: 'bg-blue-100 text-blue-700',
  shipped: 'bg-amber-100 text-amber-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-zinc-100 text-zinc-500',
  returned: 'bg-red-100 text-red-600',
}

const STATUS_DOTS: Record<string, string> = {
  new: 'bg-violet-500',
  confirmed: 'bg-emerald-500',
  unreachable: 'bg-orange-500',
  scheduled: 'bg-blue-500',
  shipped: 'bg-amber-500',
  delivered: 'bg-green-500',
  cancelled: 'bg-zinc-400',
  returned: 'bg-red-500',
}

export function StatusFilter() {
  const router = useRouter()
  const params = useSearchParams()
  const currentStatus = params.get('status') ?? ''
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function select(value: string) {
    const next = new URLSearchParams(params.toString())
    if (value) next.set('status', value)
    else next.delete('status')
    router.push(`/dashboard/orders?${next.toString()}`)
    setOpen(false)
  }

  const activeLabel = currentStatus ? STATUS_LABELS[currentStatus] : 'Tous les statuts'
  const activeDot = currentStatus ? STATUS_DOTS[currentStatus] : 'bg-zinc-300'

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:border-violet-300 hover:text-violet-700 transition-colors"
      >
        <span className={`inline-block size-2 rounded-full ${activeDot}`} />
        {activeLabel}
        <ChevronDown className={`size-4 text-zinc-400 ml-1 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-11 z-50 w-52 rounded-2xl border border-zinc-200 bg-white shadow-xl overflow-hidden">
          <div className="p-1.5">
            {/* Toutes */}
            <button
              type="button"
              onClick={() => select('')}
              className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-left transition-colors ${
                !currentStatus ? 'bg-violet-600 text-white' : 'text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              <span className={`inline-block size-2 rounded-full ${!currentStatus ? 'bg-white' : 'bg-zinc-300'}`} />
              <span className="flex-1">Tous les statuts</span>
              {!currentStatus && <Check className="size-4" />}
            </button>

            <div className="my-1.5 border-t border-zinc-100" />

            {/* Statuts */}
            {Object.entries(STATUS_LABELS).map(([key, label]) => {
              const active = currentStatus === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => select(key)}
                  className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-left transition-colors ${
                    active ? 'bg-violet-600 text-white' : 'text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  <span className={`inline-block size-2 rounded-full ${active ? 'bg-white' : STATUS_DOTS[key]}`} />
                  <span className="flex-1">{label}</span>
                  {active && <Check className="size-4" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
