import { StoreProvider } from '@/components/StoreProvider'

export const dynamic = 'force-dynamic'

export default function BoutiquesLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      {children}
    </StoreProvider>
  )
}
