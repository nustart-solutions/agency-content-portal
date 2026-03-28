'use client'

import { useState } from 'react'
import { createBrand } from './actions'

interface CreateBrandModalProps {
  organizationId: string
}

export default function CreateBrandModal({ organizationId }: CreateBrandModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)
    setError(null)
    
    const result = await createBrand(organizationId, formData)
    
    if (result?.error) {
      setError(result.error)
      setIsSubmitting(false)
    } else {
      setIsOpen(false)
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="btn btn-primary"
      >
        + New Brand
      </button>

      {isOpen && (
        <div className="modal-backdrop">
          <div className="modal-content glass-panel">
            <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 600 }}>Create Brand</h3>
            
            {error && (
              <div style={{ color: '#ef4444', marginBottom: '1.5rem', fontSize: '0.85rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                {error}
              </div>
            )}
            
            <form action={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--muted)' }}>
                  Brand Name
                </label>
                <input 
                  type="text" 
                  name="name" 
                  required 
                  placeholder="e.g. Acme Shoes"
                  style={{
                    width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem',
                    background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: 'var(--foreground)'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--muted)' }}>
                  Logo URL (Optional)
                </label>
                <input 
                  type="url" 
                  name="logo_url" 
                  placeholder="https://example.com/logo.png"
                  style={{
                    width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem',
                    background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: 'var(--foreground)'
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input 
                  type="checkbox" 
                  id="requires_approval" 
                  name="requires_approval" 
                  defaultChecked 
                  className="form-checkbox"
                />
                <label htmlFor="requires_approval" style={{ fontSize: '0.85rem', color: 'var(--foreground)' }}>
                  Requires Content Approval
                  <p style={{ margin: 0, marginTop: '2px', fontSize: '0.75rem', color: 'var(--muted)' }}>
                    Generated content will pause in "Review" status until manually approved.
                  </p>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsOpen(false)} className="btn" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--foreground)' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
