'use client'

import { useState } from 'react'
import { addBrandContext } from './actions'

export default function EditBrandContextModal({ brandId, context }: { brandId: string, context: any }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    // We can confidently reuse addBrandContext because the server action uses an UPSERT on context_type.
    const result = await addBrandContext(brandId, formData)
    
    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setIsOpen(false)
      setLoading(false)
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="btn-secondary"
        style={{ width: '100%', marginTop: '1rem', fontSize: '0.8rem', padding: '0.4rem 0.5rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer' }}
      >
        View / Edit
      </button>

      {isOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false) }}>
          <div className="modal-content glass-panel" style={{ width: '800px', maxWidth: '95vw', maxHeight: '95vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2>Edit Document: {context.context_type}</h2>
              <button type="button" className="close-button" onClick={() => setIsOpen(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-body">
              {error && <div className="error-message" style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</div>}
              
              {/* Hidden input to ensure the context_type remains the exact same for the UPSERT constraint */}
              <input type="hidden" name="context_type" value={context.context_type} />

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 500 }}>
                  Editing Raw Markdown Content
                </label>
                <textarea 
                  name="content_markdown" 
                  required 
                  rows={25}
                  defaultValue={context.content_markdown}
                  style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'white', fontFamily: 'monospace', fontSize: '0.9rem', lineHeight: '1.5' }}
                />
              </div>

              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary" style={{ padding: '0.6rem 1.2rem', background: 'transparent', border: '1px solid var(--border)', color: 'white', borderRadius: '6px', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '0.6rem 1.5rem' }}>
                  {loading ? 'Saving Changes...' : 'Save Updates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
