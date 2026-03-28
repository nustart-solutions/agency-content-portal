'use client'

import { useRef, useState } from 'react'

interface SimpleMarkdownEditorProps {
  initialValue?: string
  name?: string
  placeholder?: string
  rows?: number
}

export default function SimpleMarkdownEditor({ 
  initialValue = '', 
  name = 'content_markdown',
  placeholder = 'Type your context here...',
  rows = 15
}: SimpleMarkdownEditorProps) {
  const [content, setContent] = useState(initialValue)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    
    // If it's a list item and nothing is selected, add it to the start of the line
    if (before === '- ' && selectedText === '') {
      const currentLineStart = content.lastIndexOf('\n', start - 1) + 1
      const newText = content.substring(0, currentLineStart) + before + content.substring(currentLineStart)
      setContent(newText)
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + before.length, end + before.length)
      }, 0)
      return
    }

    const newText = content.substring(0, start) + before + selectedText + after + content.substring(end)
    setContent(newText)
    
    // Reset focus and selection
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length)
    }, 0)
  }

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Dynamic Native Toolbar */}
      <div style={{ 
        display: 'flex', 
        gap: '0.25rem', 
        padding: '0.5rem', 
        background: 'rgba(255,255,255,0.02)', 
        borderBottom: '1px solid var(--border)' 
      }}>
        <button 
          type="button" 
          onClick={() => insertText('**', '**')} 
          style={{ padding: '0.25rem 0.75rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', color: 'var(--foreground)' }}
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button 
          type="button" 
          onClick={() => insertText('*', '*')} 
          style={{ padding: '0.25rem 0.75rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', color: 'var(--foreground)' }}
          title="Italic"
        >
          <em>I</em>
        </button>
        <div style={{ width: '1px', background: 'var(--border)', margin: '0 0.25rem' }}></div>
        <button 
          type="button" 
          onClick={() => insertText('## ')} 
          style={{ padding: '0.25rem 0.75rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', color: 'var(--foreground)' }}
          title="Heading 2"
        >
          <strong>H2</strong>
        </button>
        <button 
          type="button" 
          onClick={() => insertText('### ')} 
          style={{ padding: '0.25rem 0.75rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', color: 'var(--foreground)' }}
          title="Heading 3"
        >
          <strong>H3</strong>
        </button>
        <div style={{ width: '1px', background: 'var(--border)', margin: '0 0.25rem' }}></div>
        <button 
          type="button" 
          onClick={() => insertText('[', '](https://url-here.com)')} 
          style={{ padding: '0.25rem 0.75rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', color: 'var(--foreground)', fontSize: '0.9rem' }}
          title="Add Link"
        >
          Link
        </button>
        <button 
          type="button" 
          onClick={() => insertText('- ')} 
          style={{ padding: '0.25rem 0.75rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', color: 'var(--foreground)', fontSize: '0.9rem' }}
          title="Bullet List"
        >
          List
        </button>
      </div>

      {/* Actual Text Area */}
      <textarea
        ref={textareaRef}
        name={name}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        required
        style={{
          width: '100%',
          border: 'none',
          padding: '1rem',
          background: 'transparent',
          color: 'var(--foreground)',
          resize: 'vertical',
          outline: 'none',
          fontFamily: 'monospace',
          lineHeight: '1.5'
        }}
      />
    </div>
  )
}
