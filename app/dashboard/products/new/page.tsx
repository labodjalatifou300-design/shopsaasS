import { createBlankProduct } from '../product-actions'

// Ouvrir /dashboard/products/new crée un brouillon et redirige directement vers sa page d'édition.
export default async function NewProductPage() {
  await createBlankProduct()
  return null
}
