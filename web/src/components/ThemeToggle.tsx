'use client'

import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [theme, setTheme] = useState('dark')

  useEffect(() => {
    // Snap to user's saved preference on load
    const saved = localStorage.getItem('theme') || 'dark'
    setTheme(saved)
    document.documentElement.setAttribute('data-theme', saved)
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  return (
    <button 
      onClick={toggleTheme} 
      className="btn" 
      style={{ 
        width: '100%', 
        background: 'transparent', 
        border: '1px solid var(--border)', 
        color: 'var(--foreground)' 
      }}
    >
      {theme === 'dark' ? '☀ Switch to Light Mode' : '🌙 Switch to Dark Mode'}
    </button>
  )
}
