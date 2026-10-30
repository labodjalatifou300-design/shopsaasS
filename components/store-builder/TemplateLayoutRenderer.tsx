'use client'

import React from 'react'
import { renderBlock } from '@/lib/store-builder/renderBlock'
import { partitionTemplate, resolveLayout } from '@/lib/store-builder/layout-engine'
import RevealSection from '@/components/store-builder/RevealSection'
import DescriptionRender from '@/components/store-builder/sections/DescriptionRender'

const LAYOUT_CSS = `
  .landing-template { width: 100%; }
  .landing-template--single { max-width: 100%; }
  .landing-template--full-width { max-width: 100%; }
  .landing-template-rest { width: 100%; }
  .landing-single-outer {
    width: 100%;
    min-height: 100vh;
    overflow-x: clip;
    padding-inline: 8px;
  }
  .landing-single-card {
    width: 100%;
    margin-inline: auto;
    overflow: clip;
    box-sizing: border-box;
  }
  @media (min-width: 900px) {
    .landing-single-outer {
      padding-inline: var(--landing-card-gutter, 16px);
    }
  }

  /* Zone description automatique sous le formulaire */
  .landing-auto-description {
    width: 100%;
    border-top: 1px solid #f1f5f9;
    margin-top: 8px;
  }
  .landing-auto-description .px-5 {
    padding-left: 0;
    padding-right: 0;
  }

  /* ── Full-width: sections pleine largeur avec fond alterné ── */
  .landing-template--full-width .landing-full-section {
    width: 100%;
    padding: 48px 24px;
  }
  .landing-template--full-width .landing-full-section--padded {
    padding: 48px 24px;
  }
  @media (min-width: 768px) {
    .landing-template--full-width .landing-full-section--padded {
      padding: 64px 48px;
    }
  }
  .landing-template--full-width .landing-full-section--no-pad {
    padding: 0;
  }

  /* ── Hero split : galerie | colonne achat ── */
  .landing-hero--split .landing-hero-split-grid {
    display: flex;
    flex-direction: column;
    width: 100%;
  }
  @media (min-width: 900px) {
    .landing-hero--split .landing-hero-split-grid {
      flex-direction: row;
      align-items: stretch;
      gap: 32px;
      padding: 24px 40px 24px 60px;
    }
    .landing-hero--split .landing-hero-split-gallery {
      flex: 0 0 48%;
      min-width: 0;
      position: sticky;
      top: 24px;
      max-height: calc(100vh - 48px);
      overflow: hidden;
      border-radius: 12px;
    }
    .landing-hero--split .landing-hero-split-buy {
      flex: 1 1 52%;
      min-width: 0;
      padding: 8px 16px;
      display: flex;
      flex-direction: column;
    }
  }
  .landing-hero--split.force-mobile .landing-hero-split-grid {
    flex-direction: column !important;
    padding: 0 !important;
    gap: 0 !important;
  }
  .landing-hero--split.force-mobile .landing-hero-split-gallery {
    position: static !important;
    max-height: none !important;
    border-radius: 0 !important;
  }
  .landing-hero--split.force-mobile .landing-hero-split-buy {
    padding: 16px !important;
  }

  /* ── Hero triple : galerie | form sticky | marketing ── */
  .landing-hero--triple .landing-hero-triple-desktop {
    display: none;
  }
  .landing-hero--triple .landing-hero-triple-mobile {
    display: block;
  }
  @media (min-width: 900px) {
    .landing-hero--triple .landing-hero-triple-desktop {
      display: flex;
      flex-direction: row;
      align-items: stretch;
      gap: 32px;
      padding: 24px 40px 24px 60px;
    }
    .landing-hero--triple .landing-hero-triple-gallery-col {
      flex: 0 0 48%;
      min-width: 0;
      position: sticky;
      top: 24px;
      max-height: calc(100vh - 48px);
      overflow: hidden;
      border-radius: 12px;
    }
    .landing-hero--triple .landing-hero-triple-right-col {
      flex: 1 1 52%;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 8px 16px;
    }
    .landing-hero--triple .landing-hero-triple-mobile {
      display: none;
    }

  }
  .landing-hero--triple.force-mobile .landing-hero-triple-desktop {
    display: none !important;
  }
  .landing-hero--triple.force-mobile .landing-hero-triple-mobile {
    display: block !important;
  }

  /* Sections pleine largeur hors hero */
  .landing-template-rest .landing-full-bleed {
    margin-left: calc(-1 * var(--landing-pad, 0px));
    margin-right: calc(-1 * var(--landing-pad, 0px));
    width: calc(100% + 2 * var(--landing-pad, 0px));
  }
`

interface TemplateLayoutRendererProps {
  template: any[]
  themeSettings?: Record<string, any>
  product: any
  storeId?: string | null
  /** Éditeur en mode mobile */
  forceMobile?: boolean
  wrapBlock?: (block: any, node: React.ReactNode) => React.ReactNode
  /** Active les animations de scroll (désactivé dans l'éditeur) */
  enableReveal?: boolean
  /** Tous les produits de la boutique (pour upsell / popup) */
  allProducts?: any[]
}

export default function TemplateLayoutRenderer({
  template,
  themeSettings = {},
  product,
  storeId,
  forceMobile = false,
  wrapBlock,
  enableReveal = false,
  allProducts,
}: TemplateLayoutRendererProps) {
  // Guard: template peut être null/undefined si builder_json est vide
  const safeTemplate = Array.isArray(template) ? template : []
  const layout = resolveLayout(themeSettings)
  const parts = partitionTemplate(safeTemplate, layout)

  const render = (block: any, revealVariant?: 'fadeInUp' | 'fadeInLeft' | 'fadeInRight' | 'fadeIn' | 'zoomIn', revealDelay?: number) => {
    const node = renderBlock(block, product, storeId, themeSettings, allProducts)
    if (!node) return null
    if (wrapBlock) return wrapBlock(block, node)
    if (enableReveal && revealVariant) {
      return (
        <RevealSection key={block.id} variant={revealVariant} delay={revealDelay ?? 0}>
          {node}
        </RevealSection>
      )
    }
    return <div key={block.id}>{node}</div>
  }

  const renderList = (blocks: any[]) => blocks.map(b => render(b)).filter(Boolean)

  // Liste avec animations de scroll staggersées pour les sections sous le hero
  const REVEAL_VARIANTS: Array<'fadeInUp' | 'fadeInLeft' | 'fadeInRight' | 'zoomIn' | 'fadeIn'> = [
    'fadeInUp', 'fadeInLeft', 'fadeInRight', 'fadeInUp', 'zoomIn', 'fadeIn'
  ]
  const renderRevealList = (blocks: any[]) =>
    blocks.map((b, i) => render(b, REVEAL_VARIANTS[i % REVEAL_VARIANTS.length], i * 80)).filter(Boolean)

  // Fonction pour trier un groupe de blocs selon leur ordre dans le template d'origine
  const sortByTemplateOrder = (blocks: any[]) => {
    return [...blocks].sort((a, b) => safeTemplate.indexOf(a) - safeTemplate.indexOf(b))
  }

  // Blocs structurels pleine-largeur (header, footer, barres défilantes, etc.)
  const renderStructural = (blocks: any[]) =>
    blocks.map(b => {
      const node = renderBlock(b, product, storeId, themeSettings, allProducts)
      if (!node) return null
      if (wrapBlock) return wrapBlock(b, node)
      return <div key={b.id}>{node}</div>
    }).filter(Boolean)

  if (layout === 'single-column') {
    const requestedMaxWidth = Number(themeSettings.cardMaxWidth)
    const cardMaxWidth = Number.isFinite(requestedMaxWidth) && requestedMaxWidth >= 320
      ? requestedMaxWidth
      : 860
    const outerGutter = Number.isFinite(Number(themeSettings.cardOuterGutter))
      ? Math.max(0, Math.min(96, Number(themeSettings.cardOuterGutter)))
      : 16
    const borderWidth = Math.max(0, Number(themeSettings.cardBorderWidth) || 0)
    const radius = Math.max(0, Number(themeSettings.cardBorderRadius) || 0)
    return (
      <>
        <div
          className="landing-single-outer"
          style={{
            backgroundColor: themeSettings.backgroundColor || '#f4f4f5',
            '--landing-card-gutter': `${outerGutter}px`,
            color: themeSettings.textColor || '#18181b',
            fontFamily: themeSettings.fontFamily
              ? `'${themeSettings.fontFamily}', Inter, sans-serif`
              : 'Inter, sans-serif',
            '--color-primary': themeSettings.primaryColor || '#7c3aed',
            '--color-secondary': themeSettings.secondaryColor || '#f4f4f5',
            '--color-bg': themeSettings.backgroundColor || '#f4f4f5',
            '--color-surface': themeSettings.surface || '#ffffff',
            '--color-text': themeSettings.textColor || '#18181b',
            '--color-text-soft': themeSettings.textSoftColor || '#71717a',
            '--color-border': themeSettings.border || '#e4e4e7',
            '--color-heading': themeSettings.headingColor || themeSettings.textColor || '#18181b',
            '--color-price': themeSettings.priceColor || themeSettings.primaryColor || '#7c3aed',
            '--color-gold': themeSettings.gold || '#f59e0b',
          } as React.CSSProperties}
        >
          <div
            className="landing-single-card"
            style={{
              maxWidth: cardMaxWidth,
              backgroundColor: themeSettings.surface || '#ffffff',
              boxShadow: themeSettings.cardShadow || '0 18px 54px rgba(24, 24, 27, 0.14)',
              border: `${borderWidth}px ${themeSettings.cardBorderStyle || 'solid'} ${themeSettings.cardBorderColor || themeSettings.border || 'rgba(24,24,27,.12)'}`,
              borderRadius: radius,
            }}
          >
            {renderStructural(parts.structuralTop)}
            <main className="landing-template landing-template--single">{renderRevealList(parts.rest)}</main>
            {renderStructural(parts.structuralBottom)}
          </div>
        </div>
        <style>{LAYOUT_CSS}</style>
      </>
    )
  }

  if (layout === 'full-width') {
    return (
      <>
        {renderStructural(parts.structuralTop)}
        <main className="landing-template landing-template--full-width">
          {parts.rest.map((block, i) => {
            const node = renderBlock(block, product, storeId, themeSettings, allProducts)
            if (!node) return null
            const wrapped = wrapBlock ? wrapBlock(block, node) : <div key={block.id}>{node}</div>
            if (enableReveal) {
              const variant = REVEAL_VARIANTS[i % REVEAL_VARIANTS.length]
              return (
                <RevealSection key={block.id} variant={variant} delay={i * 80}>
                  {wrapped}
                </RevealSection>
              )
            }
            return wrapped
          })}
        </main>
        {renderStructural(parts.structuralBottom)}
        <style>{LAYOUT_CSS}</style>
      </>
    )
  }

  if (layout === 'hero-split') {
    const forceClass = forceMobile ? ' force-mobile' : ''
    const rightColBlocks = sortByTemplateOrder([...parts.productInfo, ...parts.form])

    // Description automatique : affichée sous le formulaire si le produit a une description
    // et qu'aucun bloc "Description" n'est déjà dans la colonne droite
    const hasDescriptionBlock = rightColBlocks.some(b => b.type === 'Description')
    const hasProductDescription = product?.description?.trim?.()

    return (
      <>
        {renderStructural(parts.structuralTop)}
        <section className={`landing-hero landing-hero--split${forceClass}`}>
          <div className="landing-hero-split-grid">
            <div className="landing-hero-split-gallery">{renderList(parts.gallery)}</div>
            <div className="landing-hero-split-buy">
              {renderList(rightColBlocks)}
              {/* Description automatique sous le formulaire si pas déjà présente */}
              {!hasDescriptionBlock && hasProductDescription && (
                <div className="landing-auto-description">
                  <DescriptionRender settings={{}} product={product} themeSettings={themeSettings} />
                </div>
              )}
            </div>
          </div>
        </section>
        <div className="landing-template-rest">{renderRevealList(parts.rest)}</div>
        {renderStructural(parts.structuralBottom)}
        <style>{LAYOUT_CSS}</style>
      </>
    )
  }

  // hero-triple
  const forceClass = forceMobile ? ' force-mobile' : ''
  const allHeroBlocksMobile = sortByTemplateOrder([...parts.gallery, ...parts.form, ...parts.productInfo])
  const rightColTriple = sortByTemplateOrder([...parts.productInfo, ...parts.form])
  const hasDescriptionBlockTriple = rightColTriple.some(b => b.type === 'Description')
  const hasProductDescTriple = product?.description?.trim?.()

  return (
    <>
      {renderStructural(parts.structuralTop)}
      <section className={`landing-hero landing-hero--triple${forceClass}`}>
        {/* Mobile */}
        <div className="landing-hero-triple-mobile">
          {renderList(allHeroBlocksMobile)}
          {!hasDescriptionBlockTriple && hasProductDescTriple && (
            <div className="landing-auto-description">
              <DescriptionRender settings={{}} product={product} themeSettings={themeSettings} />
            </div>
          )}
        </div>
        {/* Desktop */}
        <div className="landing-hero-triple-desktop">
          <div className="landing-hero-triple-gallery-col">{renderList(parts.gallery)}</div>
          <div className="landing-hero-triple-right-col">
            {renderList(rightColTriple)}
            {!hasDescriptionBlockTriple && hasProductDescTriple && (
              <div className="landing-auto-description">
                <DescriptionRender settings={{}} product={product} themeSettings={themeSettings} />
              </div>
            )}
          </div>
        </div>
      </section>
      <div className="landing-template-rest">{renderRevealList(parts.rest)}</div>
      {renderStructural(parts.structuralBottom)}
      <style>{LAYOUT_CSS}</style>
    </>
  )
}
