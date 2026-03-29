'use client'

import { useState } from 'react'
import { updateChannelTemplate } from './actions'

export default function TemplateEditor({
  channelName,
  initialInstructions
}: {
  channelName: string,
  initialInstructions: string
}) {
  const [instructions, setInstructions] = useState(initialInstructions)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setIsSaving(true)
    setSaved(false)
    const { error, success } = await updateChannelTemplate(channelName, instructions)
    setIsSaving(false)
    
    if (success) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } else if (error) {
      alert(`Error saving: ${error}`)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <textarea
        className="form-input"
        style={{ width: '100%', minHeight: '150px', resize: 'vertical', fontFamily: 'monospace', fontSize: '0.9rem' }}
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        placeholder="Enter strict instructions for this template..."
      />
      
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem' }}>
        {saved && <span style={{ color: 'var(--success)', fontSize: '0.9rem', fontWeight: 'bold' }}>✓ Saved successfully</span>}
        <button 
          className="btn btn-primary" 
          onClick={handleSave} 
          disabled={isSaving}
          style={{ padding: '0.5rem 1.5rem', borderRadius: '4px' }}
        >
          {isSaving ? 'Saving...' : 'Save Constraints'}
        </button>
      </div>
    </div>
  )
}
