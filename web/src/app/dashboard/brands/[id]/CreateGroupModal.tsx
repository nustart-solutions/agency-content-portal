'use client'

import { useState, useTransition } from 'react'
import { createCampaignGroup } from './actions'

export default function CreateGroupModal({ brandId }: { brandId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      const result = await createCampaignGroup(brandId, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setIsOpen(false)
      }
    })
  }

  return (
    <>
      <button className="btn btn-primary" onClick={() => setIsOpen(true)}>
        + New Group
      </button>

      {isOpen && (
        <div className="modal-backdrop">
          <div className="modal-content glass-panel" style={{ padding: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 600 }}>Create Campaign Group</h2>
            <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>
              Groups are top-level initiatives (e.g., "Summer 2026", "Evergreen SEO").
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Group Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. Q4 Marketing Push"
                  className="form-input glass-panel"
                  required
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
                  {isPending ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
