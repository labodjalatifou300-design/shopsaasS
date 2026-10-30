'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full h-screen overflow-hidden bg-[#f1f2f4] relative">
      {/* Bouton retour vers /boutiques */}
      <Link
        href="/boutiques"
        className="absolute top-3 left-3 z-50 flex items-center gap-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 hover:text-gray-900 text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-sm transition-all"
        title="Retour à mes pages produits"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Mes pages</span>
      </Link>
      {children}
    </div>
  )
}
