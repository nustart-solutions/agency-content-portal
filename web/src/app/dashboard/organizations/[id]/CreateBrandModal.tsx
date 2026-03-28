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
        className="btn-primary"
      >
        + Add Brand
      </button>

      {isOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <h2>New Brand</h2>
              <button 
                className="modal-close"
                onClick={() => setIsOpen(false)}
              >
                &times;
              </button>
            </div>
            
            <form action={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Brand Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  placeholder="e.g. Acme Shoes"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="logo_url">Logo URL (Optional)</label>
                <input
                  type="url"
                  id="logo_url"
                  name="logo_url"
                  placeholder="https://example.com/logo.png"
                  className="form-input"
                />
              </div>

              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Brand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
