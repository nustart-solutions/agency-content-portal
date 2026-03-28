'use client'

import { useState } from 'react'
import { createOrganization } from './actions'

export default function CreateOrgModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError('')
    
    // Calls the secure Next.js Server Action running on Vercel's backend
    const res = await createOrganization(formData)
    
    if (res?.error) {
      setError(res.error)
    } else {
      setIsOpen(false)
    }
    setLoading(false)
  }

  return (
    <>
      <button className="btn btn-primary" onClick={() => setIsOpen(true)}>
        + New Organization
      </button>

      {isOpen && (
        <div className="modal-backdrop">
          <div className="modal-content glass-panel">
            <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 600 }}>Create Organization</h3>
            
            {error && (
              <div style={{ color: '#ef4444', marginBottom: '1.5rem', fontSize: '0.85rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                {error}
              </div>
            )}
            
            <form action={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--muted)' }}>
                  Organization Name
                </label>
                <input 
                  type="text" 
                  name="name" 
                  required 
                  placeholder="e.g. Yum! Brands"
                  style={{
                    width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem',
                    background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: 'var(--foreground)'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsOpen(false)} className="btn" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--foreground)' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scoped CSS specifically for the animated overlay */}
      <style jsx>{`
        .modal-backdrop {
          position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
          background: rgba(0,0,0,0.5); backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center; z-index: 9999;
        }
        .modal-content {
          width: 100%; max-width: 440px; padding: 2.5rem;
          animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        @keyframes scaleUp {
          from { transform: scale(0.95) translateY(10px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  )
}
