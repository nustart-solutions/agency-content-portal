'use client'

import { useState, useTransition, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { createCampaign } from './actions'

export default function CreateCampaignModal({ brandId, subgroupId, iconOnly = false }: { brandId: string, subgroupId: string, iconOnly?: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      const result = await createCampaign(brandId, subgroupId, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setIsOpen(false)
      }
    })
  }

  return (
    <>
      <button 
        style={iconOnly
          ? { background: 'transparent', border: 'none', color: 'var(--foreground)', cursor: 'pointer', padding: '0.2rem 0.5rem', opacity: 0.5, fontSize: '1.2rem', lineHeight: '1' }
          : { background: 'var(--primary)', color: 'white', border: 'none', padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer' }
        }
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(true); }}
        title={iconOnly ? "Create Campaign" : undefined}
      >
        {iconOnly ? '+' : '+ Campaign'}
      </button>

      {isOpen && mounted && typeof document !== 'undefined' && createPortal(
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ padding: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 600 }}>Create Campaign</h2>
            <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>
              The actual tactical run that generates Anchor articles and Social Assets.
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Campaign Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. Volcano Taco Relaunch"
                  className="form-input glass-panel"
                  required
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)' }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Target Publish Date (Optional)</label>
                <input
                  type="date"
                  name="target_date"
                  className="form-input glass-panel"
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)' }}
                />
              </div>

              {error && (
                <div style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.875rem' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button
                  type="button"
                  className="btn"
                  style={{ background: 'transparent', color: 'var(--muted)' }}
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isPending}>
                  {isPending ? 'Creating...' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
