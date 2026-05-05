'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function CampaignImagesManager({ campaignId }: { campaignId: string }) {
  const [images, setImages] = useState<any[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  const fetchImages = useCallback(async () => {
    const { data, error } = await supabase
      .storage
      .from('campaign_images')
      .list(campaignId)

    if (error) {
      console.error('Error fetching images:', error)
      return
    }

    if (data) {
      // Filter out empty placeholder files
      setImages(data.filter(file => file.name !== '.emptyFolderPlaceholder'))
    }
  }, [campaignId]) // Removed supabase from dependency array as it triggers re-renders unreliably

  useEffect(() => {
    fetchImages()
  }, [fetchImages])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError(null)

    // Append timestamp to prevent name collisions
    const fileExt = file.name.split('.').pop()
    const fileName = `${campaignId}/${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('campaign_images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (uploadError) {
      console.error('Upload failed:', uploadError)
      setError(uploadError.message)
    } else {
      await fetchImages()
    }
    setIsUploading(false)
    event.target.value = '' // reset input
  }

  const handleDelete = async (fileName: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return
    
    const { error } = await supabase.storage
      .from('campaign_images')
      .remove([`${campaignId}/${fileName}`])

    if (error) {
      console.error('Delete failed:', error)
      alert('Failed to delete image: ' + error.message)
    } else {
      await fetchImages()
    }
  }

  const getPublicUrl = (fileName: string) => {
    const { data } = supabase.storage
      .from('campaign_images')
      .getPublicUrl(`${campaignId}/${fileName}`)
    return data.publicUrl
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert('URL copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy!', err)
    }
  }

  return (
    <section className="glass-panel" style={{ padding: '2rem', borderRadius: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Campaign Approved Images</h2>
        
        <div style={{ position: 'relative' }}>
          <input 
            type="file" 
            id="image-upload" 
            accept="image/jpeg, image/png, image/gif, image/webp, image/svg+xml"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
            disabled={isUploading}
          />
          <label 
            htmlFor="image-upload" 
            className="button button-primary" 
            style={{ cursor: isUploading ? 'not-allowed' : 'pointer', opacity: isUploading ? 0.7 : 1, padding: '0.5rem 1rem', fontSize: '0.875rem' }}
          >
            {isUploading ? 'Uploading...' : '+ Upload Image'}
          </label>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {images.length === 0 ? (
        <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '2rem 0', fontSize: '0.875rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
          No approved images stored for this campaign yet.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
          {images.map(image => {
            const url = getPublicUrl(image.name)
            return (
              <div key={image.id} style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', background: 'rgba(255,255,255,0.03)' }}>
                <div style={{ height: '150px', background: 'rgba(0,0,0,0.2)', position: 'relative' }}>
                  <img 
                    src={url} 
                    alt={image.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                  />
                </div>
                <div style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '0.5rem' }} title={image.name}>
                    {image.name.split('_').slice(1).join('_') || image.name}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => copyToClipboard(url)}
                      style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem', background: 'var(--glass-bg)', border: '1px solid var(--border)', color: 'var(--foreground)', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Copy URL
                    </button>
                    <button 
                      onClick={() => handleDelete(image.name)}
                      style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem', background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
