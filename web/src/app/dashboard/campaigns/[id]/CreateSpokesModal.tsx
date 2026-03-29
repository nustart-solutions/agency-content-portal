'use client'

import { useState, useTransition } from 'react'
import { bulkCreateSpokeAssets } from './actions'

export default function CreateSpokesModal({ anchorId, campaignId, title }: { anchorId: string, campaignId: string, title?: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  
  const [publishedUrl, setPublishedUrl] = useState('')
  const [channels, setChannels] = useState<{ [key: string]: boolean }>({
    'gmb_post': false,
    'linkedin': false,
    'twitter': false,
    'facebook': false,
    'email_newsletter': false
  })

  const toggleChannel = (channel: string) => {
    setChannels(prev => ({ ...prev, [channel]: !prev[channel] }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const selectedChannels = Object.keys(channels).filter(c => channels[c])
    if (selectedChannels.length === 0) {
      alert('Please select at least one channel to generate.')
      return
    }

    startTransition(async () => {
      const result = await bulkCreateSpokeAssets(campaignId, anchorId, selectedChannels, publishedUrl)
      if (result.error) {
        alert(result.error)
      } else {
        setIsOpen(false)
        setPublishedUrl('')
        setChannels({
          'gmb_post': false,
          'linkedin': false,
          'twitter': false,
          'facebook': false,
          'email_newsletter': false
        })
      }
    })
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="hover:opacity-80 transition-opacity"
        style={{ 
          background: 'var(--primary)', 
          color: 'white', 
          border: 'none', 
          padding: '0.4rem 0.8rem', 
          borderRadius: '6px', 
          fontSize: '0.75rem', 
          fontWeight: 500,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem'
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.29 7 12 12 20.71 7"></polyline><line x1="12" y1="22" x2="12" y2="12"></line></svg>
        Generate Support Assets
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--background)',
            padding: '2rem',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '500px',
            border: '1px solid var(--border)'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Create Support Assets</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Select channels to generate short-form posts pointing back to this anchor article.
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                  Anchor Published URL (Required)
                </label>
                <input 
                  type="url"
                  placeholder="https://client-site.com/blog/..."
                  value={publishedUrl}
                  onChange={(e) => setPublishedUrl(e.target.value)}
                  required
                  style={{
                    width: '100%', padding: '0.75rem', 
                    background: 'var(--glass-bg)', border: '1px solid var(--border)',
                    borderRadius: '8px', color: 'var(--foreground)'
                  }}
                />
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.75rem' }}>
                  Target Channels
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {Object.entries(channels).map(([key, checked]) => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={checked}
                        onChange={() => toggleChannel(key)}
                        style={{ width: '1rem', height: '1rem' }}
                      />
                      {key.replace('_', ' ').toUpperCase()}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)}
                  style={{
                    padding: '0.75rem 1rem', background: 'transparent',
                    border: '1px solid var(--border)', borderRadius: '6px',
                    color: 'var(--foreground)', cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isPending}
                  style={{
                    padding: '0.75rem 1.5rem', background: 'var(--primary)',
                    border: 'none', borderRadius: '6px',
                    color: 'white', fontWeight: 500, cursor: isPending ? 'not-allowed' : 'pointer',
                    opacity: isPending ? 0.7 : 1
                  }}
                >
                  {isPending ? 'Generating...' : 'Bulk Generate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
