'use client'

import { useState } from 'react'
import { ImageUploader } from '@/components/ImageUploader'

export function LogoField({ storeId, initial }: { storeId: string; initial: string | null }) {
  const [images, setImages] = useState(initial ? [initial] : [])
  return (
    <div className="w-40">
      <ImageUploader storeId={storeId} folder="branding" images={images} onChange={(i) => setImages(i.slice(-1))} max={1} />
      <input type="hidden" name="logo_url" value={images[0] ?? ''} />
    </div>
  )
}
