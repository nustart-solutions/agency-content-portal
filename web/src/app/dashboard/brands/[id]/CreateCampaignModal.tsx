'use client'

import { useState, useTransition } from 'react'
import { createCampaign } from './actions'

export default function CreateCampaignModal({ brandId, subgroupId }: { brandId: string, subgroupId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

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
        style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer' }}
        onClick={() => setIsOpen(true)}
      >
        + Campaign
      </button>

      {isOpen && (
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
        </div>
      )}
    </>
  )
}
