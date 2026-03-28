'use client'

import { useState, useTransition } from 'react'
import { triggerGenerateAsset, submitExternalAsset } from './actions'

interface Props {
  assetId: string
  campaignId: string
  status: string
}

export default function AssetExecutionActions({ assetId, campaignId, status }: Props) {
  const [isPending, startTransition] = useTransition()
  const [showUpload, setShowUpload] = useState(false)

  if (status !== 'draft') {
    return null // Only visible when in draft
  }

  const handleGenerate = () => {
    startTransition(async () => {
      await triggerGenerateAsset(assetId, campaignId)
    })
  }

  const handleExternalSubmit = async (formData: FormData) => {
    startTransition(async () => {
      await submitExternalAsset(assetId, campaignId, formData)
      setShowUpload(false)
    })
  }

  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      {isPending ? (
        <span style={{ fontSize: '0.75rem', color: 'var(--primary)', padding: '0.25rem 0.5rem', background: 'var(--glass-bg)', borderRadius: '4px' }}>
          Processing...
        </span>
      ) : showUpload ? (
        <form action={handleExternalSubmit} style={{ display: 'flex', gap: '0.25rem' }}>
          <input 
            type="url" 
            name="url" 
            placeholder="Docs / URL" 
            required
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--foreground)' }}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', minHeight: 'auto' }}>
            Submit
          </button>
          <button type="button" onClick={() => setShowUpload(false)} style={{ fontSize: '0.75rem', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}>
            Cancel
          </button>
        </form>
      ) : (
        <>
          <button 
            onClick={handleGenerate}
            disabled={isPending}
            style={{ 
              background: 'var(--glass-bg)', border: '1px solid var(--primary)', color: 'var(--primary)',
              padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer',
              fontWeight: 500
            }}
          >
            Generate AI
          </button>
          <button 
            onClick={() => setShowUpload(true)}
            disabled={isPending}
            style={{ 
              background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)',
              padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer'
            }}
          >
            Upload
          </button>
        </>
      )}
    </div>
  )
}
