'use client'

import { useTransition } from 'react'
import { triggerGenerateBrandContext } from './actions'

export default function SpiderWebsiteButton({ 
  brandId, 
  websiteUrl, 
  contextStatus 
}: { 
  brandId: string, 
  websiteUrl: string | null, 
  contextStatus: string 
}) {
  const [isPending, startTransition] = useTransition()
  
  const loading = isPending || contextStatus === 'generating';

  return (
    <button 
      onClick={() => {
        if (websiteUrl) {
          startTransition(() => {
            triggerGenerateBrandContext(brandId, websiteUrl)
          })
        }
      }}
      disabled={loading || !websiteUrl}
      className={`btn ${loading ? 'btn-secondary' : 'btn-primary'}`}
      style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
      title={!websiteUrl ? "Add a website URL in Brand Settings to enable spidering" : ""}
    >
      {loading ? '🕷️ Spidering in Cloud...' : '🕷️ Spider Website'}
    </button>
  )
}
