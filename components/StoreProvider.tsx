'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

interface StoreContextValue {
  stores: any[]
  refreshStores: () => Promise<void>
}

const StoreContext = createContext<StoreContextValue>({
  stores: [],
  refreshStores: async () => {},
})

export function StoreProvider({ children }: { children: ReactNode }) {
  const supabase = createClient()
  const [stores, setStores] = useState<any[]>([])

  const refreshStores = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { data } = await supabase
      .from('stores')
      .select('*')
      .eq('owner_id', session.user.id)
      .order('created_at', { ascending: false })
    if (data) setStores(data)
  }, [supabase])

  return (
    <StoreContext.Provider value={{ stores, refreshStores }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  return useContext(StoreContext)
}
