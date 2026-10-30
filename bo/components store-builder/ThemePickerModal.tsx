'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X, Check, Palette, Loader2 } from 'lucide-react'
import { getThemesForPicker } from '@/lib/store-builder/boutique-themes'
import { buildStorePage } from '@/lib/store-builder/boutique-themes'

const THEMES = getThemesForPicker()

interface ThemePickerModalProps {
  storeId: string
  storeName: string
  currentThemeId?: string
  selectedProductId?: string | null
  onClose: () => void
  onApply: (newBuilderJson: any) => void
}

export default function ThemePickerModal({
  storeId,
  storeName,
  currentThemeId,
  selectedProductId = null,
  onClose,
  onApply,
}: ThemePickerModalProps) {
  const [selectedTheme, setSelectedTheme] = useState(currentThemeId || THEMES[0].id)
  const [applying, setApplying] = useState(false)

  const handleApply = async () => {
    setApplying(true)
    try {
      // Build new page JSON with new theme, preserving product
      const newBuilderJson = buildStorePage(selectedTheme, storeName, selectedProductId)

      // Persist to Supabase via API
      const res = await fetch('/api/stores/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          builderJson: newBuilderJson,
          themeId: selectedTheme,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.error('Error saving theme:', err)
      }

      onApply(newBuilderJson)
      onClose()
    } catch (e) {
      console.error('Theme apply error:', e)
    } finally {
      setApplying(false)
    }
  }

  const theme = THEMES.find(t => t.id === selectedTheme)

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 pt-8 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-600 to-blue-600">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <Palette size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-white font-black text-[15px]">Changer de thème</h2>
              <p className="text-white/60 text-[11px]">Le contenu existant sera remplacé par le nouveau thème</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors">
            <X size={16} className="text-white" />
          </button>
        </div>

        {/* Warning */}
        <div className="mx-6 mt-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <span className="text-lg flex-shrink-0">⚠️</span>
          <p className="text-[12px] text-amber-700 font-semibold">
            Changer de thème va <strong>reconstruire la page</strong> avec la nouvelle mise en page.
            Votre produit sera conservé, mais les personnalisations de textes et couleurs seront réinitialisées.
          </p>
        </div>

        {/* Grid */}
        <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[55vh] overflow-y-auto">
          {THEMES.map(t => {
            const isSelected = selectedTheme === t.id
            const isCurrent = currentThemeId === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTheme(t.id)}
                className={`text-left rounded-xl border-2 overflow-hidden transition-all ${
                  isSelected
                    ? 'border-indigo-500 shadow-lg shadow-indigo-100'
                    : 'border-gray-100 hover:border-gray-300 bg-white'
                }`}
              >
                {/* Preview image */}
                <div className="relative h-36 bg-gray-100">
                  <Image
                    src={t.preview_image}
                    alt={t.name}
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center shadow">
                      <Check size={12} className="text-white" />
                    </div>
                  )}
                  {isCurrent && (
                    <div className="absolute top-2 left-2 bg-white/90 text-indigo-600 text-[9px] font-black px-2 py-0.5 rounded-full shadow">
                      Actuel
                    </div>
                  )}
                  {/* Color dots */}
                  <div className="absolute bottom-2 left-2 flex gap-1">
                    {[t.preview_color, t.default_colors.accent, t.default_colors.bg].map((color, i) => (
                      <div
                        key={i}
                        className="w-3.5 h-3.5 rounded-full border border-white/80 shadow-sm"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Info */}
                <div className="p-3 bg-white">
                  <p className="font-bold text-gray-900 text-[12px] mb-0.5">{t.name}</p>
                  <p className="text-[10px] text-gray-400 line-clamp-2 leading-relaxed">{t.description}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {t.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-semibold">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-4 bg-gray-50">
          <div className="flex items-center gap-3 min-w-0">
            {theme && (
              <>
                <div className="w-6 h-6 rounded-lg shrink-0" style={{ backgroundColor: theme.preview_color }} />
                <div className="min-w-0">
                  <p className="text-[11px] text-gray-400 font-semibold">Thème sélectionné</p>
                  <p className="text-sm font-black text-gray-900 truncate">{theme.name}</p>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-[13px] font-semibold hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleApply}
              disabled={applying || selectedTheme === currentThemeId}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-[13px] font-black flex items-center gap-2 transition-colors"
            >
              {applying ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Application…
                </>
              ) : (
                <>
                  <Check size={14} />
                  Appliquer ce thème
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
