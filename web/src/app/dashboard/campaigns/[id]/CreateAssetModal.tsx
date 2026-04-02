'use client'

import { useState, useTransition } from 'react'
import { createAsset } from './actions'

const ASSET_TYPES = [
  'blog_post', 'landing_page', 'faq', 'gmb_post', 
  'social_post', 'email', 'video', 'infographic', 'other'
]

const CHANNELS = [
  'website_post', 'website_page', 'gmb_post', 
  'linkedin', 'facebook', 'instagram', 'email', 'other'
]

export default function CreateAssetModal({ campaignId }: { campaignId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      const result = await createAsset(campaignId, formData)
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
        style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}
        onClick={() => setIsOpen(true)}
      >
        + Create Asset
      </button>

      {isOpen && (
        <div className="modal-backdrop">
          <div className="modal-content glass-panel" style={{ padding: '2rem', maxWidth: '500px' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 600 }}>Create New Asset</h2>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Asset Title</label>
                <input
                  type="text"
                  name="title"
                  placeholder="e.g. 5 Reasons to Visit Baja"
                  className="form-input glass-panel"
                  required
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)' }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Asset Type</label>
                  <select
                    name="asset_type"
                    className="form-input glass-panel"
                    required
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)' }}
                  >
                    {ASSET_TYPES.map(type => (
                      <option key={type} value={type}>{type.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Channel</label>
                  <select
                    name="channel"
                    className="form-input glass-panel"
                    required
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)' }}
                  >
                    {CHANNELS.map(ch => (
                      <option key={ch} value={ch}>{ch.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="is_anchor"
                    style={{ cursor: 'pointer' }}
                  />
                  This is an Anchor Asset (Cornerstone Content)
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', background: 'rgba(56, 189, 248, 0.1)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                  <input
                    type="checkbox"
                    name="deep_research"
                    defaultChecked
                    style={{ cursor: 'pointer' }}
                  />
                  <div>
                    <strong style={{ display: 'block', color: '#38bdf8' }}>Enable Deep Research</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Retrieves Master Brand Knowledge and performs live DataForSEO SERP competitor analysis.</span>
                  </div>
                </label>
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
                  {isPending ? 'Creating...' : 'Create Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
