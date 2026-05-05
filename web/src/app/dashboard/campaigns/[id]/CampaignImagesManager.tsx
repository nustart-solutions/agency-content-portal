'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'

// Individual Image Card component to encapsulate local editing state
function ImageCard({ 
  image, 
  campaignId, 
  onDelete 
}: { 
  image: any, 
  campaignId: string, 
  onDelete: (id: string, path: string) => void 
}) {
  const supabase = createClient()
  const [status, setStatus] = useState(image.status || 'proposed')
  const [comments, setComments] = useState(image.comments || '')
  const [isSaving, setIsSaving] = useState(false)

  const url = supabase.storage.from('campaign_images').getPublicUrl(image.storage_path).data.publicUrl

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert('URL copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy!', err)
    }
  }

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value
    setStatus(newStatus)
    setIsSaving(true)
    
    await supabase
      .from('campaign_images')
      .update({ status: newStatus })
      .eq('id', image.id)
    
    setIsSaving(false)
  }

  const handleCommentBlur = async () => {
    if (comments === image.comments) return // no change
    
    setIsSaving(true)
    await supabase
      .from('campaign_images')
      .update({ comments })
      .eq('id', image.id)
    
    setIsSaving(false)
  }

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', background: 'rgba(255,255,255,0.03)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: '150px', background: 'rgba(0,0,0,0.2)', position: 'relative' }}>
        <img 
          src={url} 
          alt={image.file_name} 
          style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
        />
      </div>
      
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '0.75rem' }}>
        
        {/* Title and Top Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={image.file_name}>
            {image.file_name}
          </div>
          <button 
            onClick={() => onDelete(image.id, image.storage_path)}
            style={{ padding: '0.2rem', color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.7 }}
            title="Delete Image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>

        {/* Status Dropdown */}
        <div>
          <select 
            value={status} 
            onChange={handleStatusChange}
            style={{ 
              width: '100%', 
              padding: '0.4rem', 
              fontSize: '0.75rem', 
              background: 'var(--background)', 
              color: 'var(--foreground)', 
              border: '1px solid var(--border)', 
              borderRadius: '4px' 
            }}
          >
            <option value="proposed">Proposed</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Copy URL */}
        <button 
          onClick={() => copyToClipboard(url)}
          style={{ width: '100%', padding: '0.4rem', fontSize: '0.75rem', background: 'var(--glass-bg)', border: '1px solid var(--border)', color: 'var(--foreground)', borderRadius: '4px', cursor: 'pointer' }}
        >
          Copy URL
        </button>

        {/* Comments Box */}
        <div style={{ marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginBottom: '0.3rem', display: 'flex', justifyContent: 'space-between' }}>
            <span>Comments</span>
            {isSaving && <span style={{ color: 'var(--primary)', opacity: 0.8 }}>Saving...</span>}
          </div>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            onBlur={handleCommentBlur}
            placeholder="Add a comment..."
            style={{ 
              width: '100%', 
              minHeight: '60px', 
              resize: 'vertical', 
              padding: '0.5rem', 
              fontSize: '0.75rem', 
              background: 'rgba(0,0,0,0.1)', 
              color: 'var(--foreground)', 
              border: '1px solid var(--border)', 
              borderRadius: '4px' 
            }}
          />
        </div>

      </div>
    </div>
  )
}

export default function CampaignImagesManager({ campaignId }: { campaignId: string }) {
  const [images, setImages] = useState<any[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  const fetchImages = useCallback(async () => {
    // Fetch from database tracking table
    const { data, error } = await supabase
      .from('campaign_images')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching image tracking records:', error)
      setError(error.message)
      return
    }

    if (data) setImages(data)
  }, [campaignId])

  useEffect(() => {
    fetchImages()
  }, [fetchImages])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError(null)

    // 1. Upload to Storage
    const fileExt = file.name.split('.').pop()
    const fileName = file.name 
    const storagePath = `${campaignId}/${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('campaign_images')
      .upload(storagePath, file, { cacheControl: '3600', upsert: true })

    if (uploadError) {
      console.error('Upload failed:', uploadError)
      setError("Storage upload failed: " + uploadError.message)
      setIsUploading(false)
      return
    }

    // 2. Insert Tracking Record 
    const { error: dbError } = await supabase
      .from('campaign_images')
      .insert([{
        campaign_id: campaignId,
        storage_path: storagePath,
        file_name: fileName,
        status: 'proposed'
      }])

    if (dbError) {
      console.error('Database tracking record failed:', dbError)
      setError("Database tracking insertion failed: " + dbError.message)
    } else {
      await fetchImages()
    }

    setIsUploading(false)
    event.target.value = '' // reset input
  }

  const handleDelete = async (id: string, storagePath: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return
    
    // 1. Delete Storage object
    const { error: storageError } = await supabase.storage
      .from('campaign_images')
      .remove([storagePath])

    if (storageError) {
      console.error('Storage delete failed:', storageError)
      alert('Failed to delete image from storage: ' + storageError.message)
      return
    }

    // 2. Delete Database record
    const { error: dbError } = await supabase
      .from('campaign_images')
      .delete()
      .eq('id', id)

    if (dbError) {
      console.error('Database delete failed:', dbError)
      alert('Failed to delete tracking record: ' + dbError.message)
    } else {
      setImages(images.filter(img => img.id !== id))
    }
  }

  return (
    <section className="glass-panel" style={{ padding: '2rem', borderRadius: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Campaign Images</h2>
        
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
          No images uploaded for this campaign yet.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
          {images.map(image => (
            <ImageCard 
              key={image.id} 
              image={image} 
              campaignId={campaignId} 
              onDelete={handleDelete} 
            />
          ))}
        </div>
      )}
    </section>
  )
}
