'use client'

import React from 'react'

// Icônes SVG animées (CSS animations) — remplacement de lottie-react
// Identiques visuellement mais sans dépendance externe

interface LottieIconProps {
  name: 'truck' | 'shield' | 'star' | 'lock' | 'check' | 'gift' | 'chat' | string
  size?: number
  loop?: boolean
  className?: string
}

const ICON_PATHS: Record<string, React.ReactNode> = {
  truck: (
    <>
      <path d="M1 3h11v9H1zM12 6h3l2 3v3h-5V6z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="4" cy="14" r="1.5" />
      <circle cx="14" cy="14" r="1.5" />
    </>
  ),
  shield: (
    <path d="M12 2L4 5v5c0 4.4 3.4 8.5 8 9.5 4.6-1 8-5.1 8-9.5V5L12 2z" strokeLinecap="round" strokeLinejoin="round" />
  ),
  star: (
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" strokeLinecap="round" strokeLinejoin="round" />
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="11" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  check: (
    <>
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  gift: (
    <>
      <polyline points="20 12 20 22 4 22 4 12" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="2" y="7" width="20" height="5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="22" x2="12" y2="7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  chat: (
    <>
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
}

const COLORS: Record<string, string> = {
  truck: '#6366f1',
  shield: '#10b981',
  star: '#f59e0b',
  lock: '#6366f1',
  check: '#10b981',
  gift: '#f59e0b',
  chat: '#6366f1',
}

/**
 * Icône animée SVG — remplace lottie-react pour une compatibilité maximale.
 * Utilise des animations CSS (pulse / spin) selon le type d'icône.
 */
export default function LottieIcon({ name, size = 48, className = '' }: LottieIconProps) {
  const iconPaths = ICON_PATHS[name] || ICON_PATHS['shield']
  const color = COLORS[name] || '#6366f1'
  const animStyle = name === 'star'
    ? { animation: 'spin 3s linear infinite' }
    : { animation: 'pulse 2s ease-in-out infinite' }

  return (
    <div style={{ width: size, height: size }} className={className}>
      <style>{`
        @keyframes lottie-spin { from { transform: rotate(0deg) scale(1); } 50% { transform: rotate(180deg) scale(1.1); } to { transform: rotate(360deg) scale(1); } }
        @keyframes lottie-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
      `}</style>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        style={
          name === 'star'
            ? { animation: 'lottie-spin 3s linear infinite' }
            : { animation: 'lottie-pulse 2s ease-in-out infinite' }
        }
      >
        {iconPaths}
      </svg>
    </div>
  )
}
