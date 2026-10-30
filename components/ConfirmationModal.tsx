'use client'

import { useEffect } from 'react'
import { AlertTriangle, Trash2, X } from 'lucide-react'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'default',
}: ConfirmationModalProps) {
  // Fermer avec Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const isDanger = variant === 'danger'

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        style={{ animation: 'modalPop 200ms cubic-bezier(0.34, 1.56, 0.64, 1) both' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header coloré */}
        <div className={`px-6 pt-6 pb-4 flex items-start gap-4 ${isDanger ? 'bg-red-50' : 'bg-indigo-50'}`}>
          <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${isDanger ? 'bg-red-100' : 'bg-indigo-100'}`}>
            {isDanger
              ? <Trash2 className="w-5 h-5 text-red-600" />
              : <AlertTriangle className="w-5 h-5 text-indigo-600" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <h2 className={`font-bold text-base leading-tight ${isDanger ? 'text-red-900' : 'text-indigo-900'}`}>
              {title}
            </h2>
            <p className={`text-sm mt-1 leading-relaxed ${isDanger ? 'text-red-700' : 'text-indigo-700'}`}>
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${isDanger ? 'hover:bg-red-100 text-red-400' : 'hover:bg-indigo-100 text-indigo-400'}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-white flex gap-3 justify-end border-t border-zinc-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-zinc-200 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => { onConfirm(); onClose() }}
            className={`px-5 py-2 rounded-xl text-sm font-bold text-white transition-all active:scale-95 shadow-sm ${
              isDanger
                ? 'bg-red-600 hover:bg-red-700 shadow-red-200'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modalPop {
          from { opacity: 0; transform: scale(0.92) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}
