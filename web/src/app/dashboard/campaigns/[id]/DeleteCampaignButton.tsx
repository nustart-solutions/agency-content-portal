'use client'

import { useTransition } from 'react'
import { deleteCampaign } from './actions'

export default function DeleteCampaignButton({ campaignId, brandId }: { campaignId: string, brandId: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <button 
      onClick={() => {
        if (window.confirm("Are you sure you want to delete this campaign? All attached assets will also be deleted. This action cannot be undone.")) {
          startTransition(async () => {
            await deleteCampaign(campaignId, brandId)
          })
        }
      }}
      disabled={isPending}
      style={{
        background: 'transparent',
        color: '#ff4444',
        border: '1px solid rgba(255, 68, 68, 0.3)',
        padding: '0.5rem 1rem',
        borderRadius: '6px',
        fontSize: '0.875rem',
        cursor: isPending ? 'not-allowed' : 'pointer',
        opacity: isPending ? 0.5 : 1,
        transition: 'all 0.2s ease',
        fontWeight: 500
      }}
      className="hover:bg-red-950/20"
    >
      {isPending ? 'Deleting...' : 'Delete Campaign'}
    </button>
  )
}
