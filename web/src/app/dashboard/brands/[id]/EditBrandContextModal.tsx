'use client'

import { useState } from 'react'
import { addBrandContext } from './actions'
import SimpleMarkdownEditor from './SimpleMarkdownEditor'

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
        className="btn btn-secondary"
        style={{ width: '100%', marginTop: '1rem', fontSize: '0.85rem', padding: '0.5rem' }}
      >
        View / Edit
      </button>

      {isOpen && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false) }}>
          <div className="modal-content glass-panel" style={{ width: '1050px', maxWidth: '95vw', maxHeight: '95vh', overflowY: 'auto', backgroundColor: 'var(--background)' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Edit Document: <strong style={{ color: 'var(--primary)' }}>{context.context_type}</strong></h2>
              <button type="button" onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', fontSize: '2rem', cursor: 'pointer', color: 'var(--muted)', lineHeight: 1 }}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-body">
              {error && <div className="error-message" style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</div>}
              
              {/* Hidden input to ensure the context_type remains the exact same for the UPSERT constraint */}
              <input type="hidden" name="context_type" value={context.context_type} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <SimpleMarkdownEditor 
                  name="content_markdown"
                  initialValue={context.content_markdown}
                  rows={18}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsOpen(false)} className="btn btn-secondary" style={{ padding: '0.6rem 1.2rem' }}>
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '0.6rem 1.5rem' }}>
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
