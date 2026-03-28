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
  
  // Smart Default: If they click "View / Edit" on an EXISTING document, open straight to Preview. 
  // If they click "+ Add New Context", start in Write mode.
  const [mode, setMode] = useState<'write' | 'preview'>(initialValue ? 'preview' : 'write')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    
    // Auto-indent list items safely
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
    
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length)
    }, 0)
  }

  // Fast, safe zero-dependency Markdown -> HTML visual parser just for client reading
  const renderPreview = (text: string) => {
    if (!text) return '<p style="color: var(--muted); font-style: italic;">Nothing to preview yet.</p>';
    
    let html = text
      .replace(/</g, '&lt;') // Basic XSS protection
      .replace(/>/g, '&gt;')
      .replace(/^### (.*$)/gim, '<h3 style="margin-top: 1.25rem; margin-bottom: 0.5rem; color: var(--primary); font-size: 1.1rem; font-weight: 600;">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 style="margin-top: 1.5rem; margin-bottom: 0.5rem; color: var(--primary); font-size: 1.25rem; font-weight: 600;">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 style="margin-top: 1.5rem; margin-bottom: 0.75rem; color: var(--primary); font-size: 1.5rem; font-weight: 700;">$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank" style="color: #3b82f6; text-decoration: underline;">$1</a>')
      .replace(/^- (.*$)/gim, '<li style="margin-left: 1.5rem; margin-bottom: 0.25rem;">$1</li>')
      .replace(/\n\n/gim, '<br /><br />') // Paragraph breaks
      .replace(/([^\n])\n([^\n])/gim, '$1<br />$2'); // Line breaks
    
    return html;
  }

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      
      {/* 1. GitHub-Style Tab Header */}
      <div style={{ display: 'flex', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <button
          type="button"
          onClick={() => setMode('preview')}
          style={{
            padding: '0.75rem 1.5rem',
            background: mode === 'preview' ? 'transparent' : 'rgba(0,0,0,0.2)',
            border: 'none',
            borderRight: '1px solid var(--border)',
            color: mode === 'preview' ? 'var(--primary)' : 'var(--muted)',
            fontWeight: mode === 'preview' ? 600 : 500,
            cursor: 'pointer',
            borderBottom: mode === 'preview' ? '2px solid var(--primary)' : '2px solid transparent',
            transition: 'all 0.2s ease'
          }}
        >
          Reader / Preview
        </button>
        <button
          type="button"
          onClick={() => setMode('write')}
          style={{
            padding: '0.75rem 1.5rem',
            background: mode === 'write' ? 'transparent' : 'rgba(0,0,0,0.2)',
            border: 'none',
            borderRight: '1px solid var(--border)',
            color: mode === 'write' ? 'var(--primary)' : 'var(--muted)',
            fontWeight: mode === 'write' ? 600 : 500,
            cursor: 'pointer',
            borderBottom: mode === 'write' ? '2px solid var(--primary)' : '2px solid transparent',
            transition: 'all 0.2s ease'
          }}
        >
          Edit Raw Markdown
        </button>
      </div>

      {/* 2. Content Area */}
      {mode === 'write' ? (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Dynamic Native Toolbar */}
          <div style={{ 
            display: 'flex', 
            gap: '0.25rem', 
            padding: '0.5rem', 
            background: 'rgba(255,255,255,0.02)', 
            borderBottom: '1px solid var(--border)' 
          }}>
            <button title="Bold" type="button" onClick={() => insertText('**', '**')} style={{ padding: '0.25rem 0.75rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', color: 'var(--foreground)' }}><strong>B</strong></button>
            <button title="Italic" type="button" onClick={() => insertText('*', '*')} style={{ padding: '0.25rem 0.75rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', color: 'var(--foreground)' }}><em>I</em></button>
            <div style={{ width: '1px', background: 'var(--border)', margin: '0 0.25rem' }}></div>
            <button title="Heading 2" type="button" onClick={() => insertText('## ')} style={{ padding: '0.25rem 0.75rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', color: 'var(--foreground)' }}><strong>H2</strong></button>
            <button title="Heading 3" type="button" onClick={() => insertText('### ')} style={{ padding: '0.25rem 0.75rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', color: 'var(--foreground)' }}><strong>H3</strong></button>
            <div style={{ width: '1px', background: 'var(--border)', margin: '0 0.25rem' }}></div>
            <button title="Add Link" type="button" onClick={() => insertText('[', '](https://url-here.com)')} style={{ padding: '0.25rem 0.75rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', color: 'var(--foreground)', fontSize: '0.9rem' }}>Link</button>
            <button title="Bullet List" type="button" onClick={() => insertText('- ')} style={{ padding: '0.25rem 0.75rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', color: 'var(--foreground)', fontSize: '0.9rem' }}>List</button>
          </div>

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
              lineHeight: '1.5',
              fontSize: '0.9rem'
            }}
          />
        </div>
      ) : (
        <div style={{ 
          padding: '1.5rem', 
          minHeight: `${rows * 1.5}rem`, 
          background: 'rgba(0,0,0,0.1)', 
          overflowY: 'auto' 
        }}>
          {/* We strictly must have this hidden input so the FormData saves effectively during Preview Mode */}
          <input type="hidden" name={name} value={content} />
          
          <div 
            className="rendered-preview"
            dangerouslySetInnerHTML={{ __html: renderPreview(content) }} 
            style={{
              lineHeight: '1.6',
              color: 'var(--foreground)',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
          />
        </div>
      )}
    </div>
  )
}
