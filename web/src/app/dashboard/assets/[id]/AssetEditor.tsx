'use client'

import { useState } from 'react'
import { saveAssetDetails } from './actions'
import { syncDocAction } from './syncDocAction'

export function AssetEditor({ asset }: { asset: any }) {
  const [isSaving, setIsSaving] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)

  async function handleSync() {
    if (!asset.google_doc_url) return
    setIsSyncing(true)
    setMessage(null)
    const result = await syncDocAction(asset.id)
    if (result.error) {
       setMessage({ text: result.error, type: 'error' })
    } else {
       setMessage({ text: 'Content fully synced from Google Doc!', type: 'success' })
    }
    setIsSyncing(false)
  }

  // Wait, I need a form
  async function onSubmit(formData: FormData) {
    setIsSaving(true)
    setMessage(null)
    const result = await saveAssetDetails(asset.id, formData)
    
    if (result.error) {
       setMessage({ text: result.error, type: 'error' })
    } else if (result.success) {
       setMessage({ text: result.message || 'Saved successfully', type: 'success' })
    }
    setIsSaving(false)
  }

  return (
    <form action={onSubmit} className="glass-panel" style={{ padding: '2rem', borderRadius: '12px', minHeight: '60vh', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Asset Editor</h2>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
             <select 
               name="status" 
               defaultValue={asset.status} 
               style={{ padding: '0.4rem 0.8rem', borderRadius: '4px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
             >
               <option value="draft">Draft</option>
               <option value="in_progress">In Progress</option>
               <option value="review">Review</option>
               <option value="staged">Staged (Trigger WP Publish)</option>
               <option value="published">Published</option>
             </select>
             <button type="submit" disabled={isSaving} className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.875rem' }}>
                {isSaving ? 'Saving...' : 'Save Asset'}
             </button>
          </div>
       </div>

       {message && (
         <div style={{ 
           padding: '1rem', 
           borderRadius: '8px', 
           background: message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
           color: message.type === 'error' ? '#ef4444' : '#10b981',
           border: `1px solid ${message.type === 'error' ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`
         }}>
            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{message.text}</p>
         </div>
       )}

       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
         <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
           <label style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 500 }}>Focus Keyword</label>
           <input 
             name="focus_keyword" 
             defaultValue={asset.focus_keyword || ''} 
             placeholder="e.g. kitchen sink installation"
             style={{ padding: '0.6rem 1rem', borderRadius: '4px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
           />
         </div>
         <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
           <label style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 500 }}>Meta Title</label>
           <input 
             name="meta_title" 
             defaultValue={asset.meta_title || ''} 
             placeholder="Leave blank to use Asset Title"
             style={{ padding: '0.6rem 1rem', borderRadius: '4px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
           />
         </div>
         <div style={{ display: 'grid', gridColumn: 'span 2', flexDirection: 'column', gap: '0.4rem' }}>
           <label style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 500 }}>Meta Description</label>
           <textarea 
             name="meta_description" 
             defaultValue={asset.meta_description || ''} 
             placeholder="Short summary for search engines..."
             style={{ padding: '0.6rem 1rem', borderRadius: '4px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: 'var(--foreground)', resize: 'vertical', minHeight: '60px' }}
           />
         </div>
       </div>

       <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 500 }}>
               Content Body (Markdown)
            </label>
            <button 
              type="button" 
              onClick={handleSync}
              disabled={isSyncing || !asset.google_doc_url}
              style={{
                background: 'rgba(66, 133, 244, 0.1)',
                color: '#4285F4',
                border: '1px solid rgba(66, 133, 244, 0.2)',
                padding: '0.3rem 0.8rem',
                borderRadius: '4px',
                fontSize: '0.8rem',
                cursor: (isSyncing || !asset.google_doc_url) ? 'not-allowed' : 'pointer',
                opacity: (isSyncing || !asset.google_doc_url) ? 0.5 : 1
              }}
            >
              {isSyncing ? 'Syncing...' : 'Sync from Google Doc'}
            </button>
          </div>
          <textarea 
            name="content_markdown"
            defaultValue={asset.content_markdown || ''}
            placeholder="No content generated yet."
            style={{
              flex: 1,
              width: '100%',
              minHeight: '400px',
              background: 'rgba(0,0,0,0.2)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '1.5rem',
              color: 'var(--foreground)',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              lineHeight: '1.6',
              resize: 'vertical'
            }}
          />
       </div>
    </form>
  )
}
