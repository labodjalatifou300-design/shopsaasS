import { StoreProvider } from '@/components/StoreProvider'

export default function BoutiquesLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      {children}
    </StoreProvider>
  )
}
