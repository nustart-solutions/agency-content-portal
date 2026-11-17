'use client'

import { useState } from 'react'

// Brand logo that hides itself if the image fails to load (e.g. the file was
// on a website that no longer exists), instead of showing a broken image.
// The brand name is always shown next to it, so nothing is lost.
export default function BrandLogo({ src, name }: { src: string; name: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) return null

  return (
    <img
      src={src}
      alt={`${name} logo`}
      onError={() => setFailed(true)}
      style={{ height: '36px', width: 'auto', borderRadius: '6px', objectFit: 'contain' }}
    />
  )
}
