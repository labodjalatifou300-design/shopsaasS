// Partition du template selon le layout du thème (structure visuelle, pas les couleurs)

export type LayoutMode = 'single-column' | 'hero-split' | 'hero-triple' | 'full-width'

const GALLERY_TYPES = new Set(['Galerie', 'medias', 'gallery'])
const FORM_TYPES = new Set(['OrderForm', 'order_form'])

// Blocs qui doivent TOUJOURS être en pleine largeur, jamais dans une colonne
// (en-tête, pied de page, barres d'annonce, etc.)
export const STRUCTURAL_FULL_WIDTH_TYPES = new Set([
  'AnnouncementBar', 'announcement_bar',
  'Header', 'header',
  'Footer', 'footer',
  'countdown_top_bar',
  'marquee',
])

// Seuls les blocs du produit et les éléments de conversion compacts restent
// dans la colonne hero. Les autres sections marketing gardent toute la largeur
// du contenu sous le hero, au lieu d'être écrasées dans la colonne d'achat.
const PRODUCT_INFO_TYPES = new Set([
  'Titre', 'Note de produit', 'Prix', 'Description',
])
const HERO_SUPPORT_TYPES = new Set([
  'trust_bar', 'stock_urgency',
])

export interface TemplateParts {
  /** Blocs structurels pleine-largeur qui apparaissent avant le hero (header, announcement, countdown_top_bar, marquee) */
  structuralTop: any[]
  /** Blocs structurels pleine-largeur qui apparaissent après tout le contenu (footer) */
  structuralBottom: any[]
  gallery: any[]
  form: any[]
  productInfo: any[]
  heroSidebar: any[]
  heroMarketing: any[]
  heroBuyColumn: any[]
  rest: any[]
}

/** Découpe le template en zones hero + reste selon le layout, de manière dynamique */
export function partitionTemplate(template: any[], layout: LayoutMode): TemplateParts {
  // 1. Extraire les blocs structurels (header, footer, barres) - ils ne participent jamais au hero-split
  const footerTypes = new Set(['Footer', 'footer'])
  const structuralTop = template.filter(b => STRUCTURAL_FULL_WIDTH_TYPES.has(b.type) && !footerTypes.has(b.type))
  const structuralBottom = template.filter(b => footerTypes.has(b.type))
  const structuralIds = new Set([...structuralTop, ...structuralBottom].map(b => b.id))

  // Template sans les blocs structurels
  const content = template.filter(b => !structuralIds.has(b.id))

  const gallery = content.filter(b => GALLERY_TYPES.has(b.type))
  
  // Si on est en layout single-column ou full-width, tout va dans rest pour être affiché de haut en bas
  if (layout === 'single-column' || layout === 'full-width') {
    return { 
      structuralTop, 
      structuralBottom, 
      gallery: [], form: [], productInfo: [], 
      heroSidebar: [], heroMarketing: [], heroBuyColumn: [], 
      rest: content 
    }
  }

  // Construire le hero à partir des blocs identifiés, pas d'une coupure au
  // premier type connu. Ainsi les nouveaux blocs marketing ne peuvent pas
  // accidentellement s'empiler dans la colonne d'achat.
  const isHeroBlock = (block: any) =>
    GALLERY_TYPES.has(block.type) ||
    FORM_TYPES.has(block.type) ||
    PRODUCT_INFO_TYPES.has(block.type) ||
    HERO_SUPPORT_TYPES.has(block.type)
  const heroBlocks = content.filter(isHeroBlock)
  const rest = content.filter(block => !isHeroBlock(block))

  const heroGalleryIds = new Set(gallery.map(b => b.id))
  const withoutGallery = heroBlocks.filter(b => !heroGalleryIds.has(b.id))

  // Extraire les blocs produit et formulaire du hero, en gardant leur ordre.
  // Extraire le formulaire pour le hero-triple qui le met dans une colonne dédiée
  const form = heroBlocks.filter(b => FORM_TYPES.has(b.type))
  const formIds = new Set(form.map(b => b.id))
  const otherHero = withoutGallery.filter(b => !formIds.has(b.id))
  
  return { 
    structuralTop,
    structuralBottom,
    gallery, 
    form, 
    productInfo: otherHero, 
    heroSidebar: [], 
    heroMarketing: [], 
    heroBuyColumn: [], 
    rest
  }
}

export function resolveLayout(themeSettings?: Record<string, any>): LayoutMode {
  const l = themeSettings?.layout
  if (l === 'hero-split' || l === 'hero-triple' || l === 'single-column' || l === 'full-width') return l
  return 'single-column'
}
