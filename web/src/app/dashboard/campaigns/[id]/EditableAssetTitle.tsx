'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import Link from 'next/link'
import { updateAssetTitle } from './actions'

export default function EditableAssetTitle({ 
  assetId, 
  campaignId, 
  initialTitle 
}: { 
  assetId: string, 
  campaignId: string, 
  initialTitle: string 
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(initialTitle)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditing])

  const handleSave = () => {
    if (title.trim() === '' || title === initialTitle) {
      setTitle(initialTitle)
      setIsEditing(false)
      return
    }

    startTransition(async () => {
      const result = await updateAssetTitle(assetId, campaignId, title)
      if (result?.error) {
        alert(result.error)
        setTitle(initialTitle)
      }
      setIsEditing(false)
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') {
      setTitle(initialTitle)
      setIsEditing(false)
    }
  }

  if (isEditing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={isPending}
          style={{
            fontSize: '1rem',
            fontWeight: 500,
            padding: '0.25rem 0.5rem',
            background: 'var(--glass-bg)',
            border: '1px solid var(--primary)',
            borderRadius: '4px',
            color: 'var(--foreground)',
            width: '100%',
            maxWidth: '400px'
          }}
        />
        {isPending && <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Saving...</span>}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 500, margin: 0 }}>
        <Link href={`/dashboard/assets/${assetId}`} style={{ color: 'inherit', textDecoration: 'none', cursor: 'pointer' }} className="hover:opacity-80">
          {title}
        </Link>
      </h3>
      <button 
        onClick={() => setIsEditing(true)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--muted)',
          padding: '0.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.6,
        }}
        className="hover:opacity-100 transition-opacity"
        title="Edit Name"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
      </button>
    </div>
  )
}
