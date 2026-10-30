'use client'

import { switchStore } from './actions'

export function StoreSwitcher({
  stores,
  currentId,
}: {
  stores: { id: string; name: string }[]
  currentId: string
}) {
  return (
    <form action={switchStore}>
      <select
        name="store_id"
        defaultValue={currentId}
        onChange={(e) => {
          if (e.target.value === '__new') {
            window.location.href = '/onboarding?new=1'
            return
          }
          e.currentTarget.form?.requestSubmit()
        }}
        className="dashboard-store-select w-full truncate rounded-xl px-3 py-2 text-sm font-semibold outline-none"
      >
        {stores.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
        <option value="__new">+ Nouvelle boutique</option>
      </select>
    </form>
  )
}
