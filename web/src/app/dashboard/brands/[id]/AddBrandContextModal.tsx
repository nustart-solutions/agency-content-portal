'use client'

import { useState } from 'react'
import { addBrandContext } from './actions'
import SimpleMarkdownEditor from './SimpleMarkdownEditor'

const CONTEXT_TYPES = [
  'brand-voice',
  'competitor-analysis',
  'cro-best-practices',
  'features',
  'internal-links-map',
  'seo-guidelines',
  'style-guide',
  'target-keywords',
  'uvp',
  'writing-examples'
]

export default function AddBrandContextModal({ brandId }: { brandId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
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
        className="btn-primary"
        style={{ fontSize: '0.875rem', padding: '0.4rem 0.8rem' }}
      >
        + Add New Context
      </button>

      {isOpen && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false) }}>
          <div className="modal-content glass-panel" style={{ width: '1050px', maxWidth: '95vw', maxHeight: '95vh', overflowY: 'auto', backgroundColor: 'var(--background)' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Add Brand Context</h2>
              <button type="button" onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', fontSize: '2rem', cursor: 'pointer', color: 'var(--muted)', lineHeight: 1 }}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-body">
              {error && <div className="error-message" style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</div>}
              
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Context Type</label>
                <select 
                  name="context_type" 
                  required 
                  style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '6px', color: 'white' }}
                >
                  <option value="" disabled selected>Select Context Type...</option>
                  {CONTEXT_TYPES.map(type => (
                    <option key={type} value={type} style={{ color: 'black' }}>{type}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <SimpleMarkdownEditor 
                  name="content_markdown"
                  placeholder="Paste or type the rich context here. You can use the buttons above to format the text!"
                  rows={15}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary" style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--border)', color: 'white', borderRadius: '6px', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '0.5rem 1.5rem' }}>
                  {loading ? 'Saving...' : 'Save Context'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
