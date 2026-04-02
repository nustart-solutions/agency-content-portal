'use client'

import { useState, useTransition } from 'react'
import { bulkImportPublishedAnchors } from './actions'

const ASSET_TYPES = [
  'blog_post', 'landing_page', 'faq', 'gmb_post', 
  'social_post', 'email', 'video', 'infographic', 'other'
]

const CHANNELS = [
  'website_post', 'website_page', 'gmb_post', 
  'linkedin', 'facebook', 'instagram', 'email', 'other'
]

export default function BulkImportAnchorsModal({ campaignId }: { campaignId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      const result = await bulkImportPublishedAnchors(campaignId, formData)
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
        style={{ background: 'var(--glass-bg)', color: 'var(--foreground)', border: '1px solid var(--border)', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        onClick={() => setIsOpen(true)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
        Bulk Import
      </button>

      {isOpen && (
        <div className="modal-backdrop">
          <div className="modal-content glass-panel" style={{ padding: '2rem', maxWidth: '600px', width: '100%' }}>
            <h2 style={{ marginBottom: '0.5rem', fontSize: '1.5rem', fontWeight: 600 }}>Bulk Import Published Anchors</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              Paste a list of already-published content directly from your spreadsheet. The system expects rows to be separated by new lines, and columns to be separated by tabs. <br/><br/>
              <strong>Expected Order:</strong> <code>Title (Required) | Published URL (Optional) | Date (Optional)</code>
            </p>

            <form onSubmit={handleSubmit}>
              
              <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Global Asset Type</label>
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
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Global Channel</label>
                  <select
                    name="channel"
                    className="form-input glass-panel"
                    required
                    defaultValue="website_post"
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)' }}
                  >
                    {CHANNELS.map(ch => (
                      <option key={ch} value={ch}>{ch.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <textarea
                  name="raw_text"
                  placeholder="The Best Things to do in LA	https://example.com/la	2026-03-28"
                  className="form-input glass-panel"
                  required
                  rows={8}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', fontFamily: 'monospace', whiteSpace: 'pre' }}
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
                  {isPending ? 'Importing...' : 'Import Assets'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
