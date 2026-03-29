'use client'

import { useState } from 'react'
import { updateBrand, updateBrandCredentials } from './actions'

interface EditBrandModalProps {
  brand: {
    id: string
    name: string
    logo_url: string | null
    website_url: string | null
    requires_approval: boolean
  }
}

export default function EditBrandModal({ brand }: EditBrandModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCredentials, setShowCredentials] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)
    setError(null)
    
    // First update the basic brand info
    const result = await updateBrand(brand.id, formData)
    
    if (result?.error) {
      setError(result.error)
      setIsSubmitting(false)
      return
    }

    // Then securely update credentials if any were provided
    if (formData.get('wp_url') || formData.get('wp_username') || formData.get('wp_password')) {
      const credResult = await updateBrandCredentials(brand.id, formData)
      if (credResult?.error) {
        setError("Brand saved, but credentials failed: " + credResult.error)
        setIsSubmitting(false)
        return
      }
    }

    // Success
    setIsOpen(false)
    setIsSubmitting(false)
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="btn btn-secondary"
        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
      >
        &#9881; Edit Brand
      </button>

      {isOpen && (
        <div className="modal-backdrop">
          <div className="modal-content glass-panel" style={{ background: 'var(--background)' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 600 }}>Edit Brand Profile</h3>
            
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
                  defaultValue={brand.name}
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
                  Website URL
                </label>
                <input 
                  type="url" 
                  name="website_url" 
                  defaultValue={brand.website_url || ''}
                  placeholder="https://example.com"
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
                  defaultValue={brand.logo_url || ''}
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
                  id={`edit_requires_approval_${brand.id}`}
                  name="requires_approval" 
                  defaultChecked={brand.requires_approval}
                  className="form-checkbox"
                />
                <label htmlFor={`edit_requires_approval_${brand.id}`} style={{ fontSize: '0.85rem', color: 'var(--foreground)' }}>
                  Requires Content Approval
                  <p style={{ margin: 0, marginTop: '2px', fontSize: '0.75rem', color: 'var(--muted)' }}>
                    Generated content will pause in "Review" status until manually approved.
                  </p>
                </label>
              </div>

              <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <button 
                  type="button" 
                  onClick={() => setShowCredentials(!showCredentials)}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', padding: 0 }}
                >
                  {showCredentials ? '▼' : '▶'} Advanced: WordPress Credentials (Encrypted)
                </button>
                
                {showCredentials && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem', padding: '1.25rem', background: 'rgba(0,0,0,0.1)', borderRadius: '0.5rem', border: '1px dashed var(--border)' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted)', margin: 0 }}>
                      Stored securely in Supabase Vault. Leaving these blank will keep existing credentials.
                    </p>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--muted)' }}>
                        WP API URL
                      </label>
                      <input 
                        type="url" 
                        name="wp_url" 
                        placeholder="e.g. https://example.com/wp-json"
                        style={{
                          width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem',
                          background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: 'var(--foreground)'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--muted)' }}>
                        WP Username
                      </label>
                      <input 
                        type="text" 
                        name="wp_username" 
                        placeholder="Admin Username"
                        style={{
                          width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem',
                          background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: 'var(--foreground)'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--muted)' }}>
                        WP Application Password
                      </label>
                      <input 
                        type="password" 
                        name="wp_password" 
                        placeholder="••••••••••••••••"
                        style={{
                          width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem',
                          background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: 'var(--foreground)'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsOpen(false)} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ padding: '0.5rem 1.5rem' }}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
