'use client'

import { useState, useTransition, useEffect } from 'react'
import { getAssetNotifications, addAssetNotification } from './actions'

interface Props {
  assetId: string
  campaignId: string
}

export default function AssetNotificationsModal({ assetId, campaignId }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [notifications, setNotifications] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = async () => {
    setIsLoading(true)
    const result = await getAssetNotifications(assetId)
    setIsLoading(false)
    if (result.success && result.data) {
      setNotifications(result.data)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen])

  const handleSubmit = (formData: FormData) => {
    setError(null)
    startTransition(async () => {
      const result = await addAssetNotification(assetId, campaignId, formData)
      if (result.error) {
        setError(result.error)
      } else {
        // Form handled, refresh the list
        const formElement = document.getElementById(`notify-form-${assetId}`) as HTMLFormElement
        if (formElement) formElement.reset()
        await fetchNotifications()
      }
    })
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="hover:opacity-80 transition-opacity" 
        style={{ color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 'inherit', fontFamily: 'inherit' }}
        title="View Notifications"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
        Notify
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="glass-panel" style={{
            background: 'var(--card-bg)', padding: '2rem', borderRadius: '12px',
            width: '100%', maxWidth: '500px', border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Asset Notifications</h2>
              <button 
                onClick={() => setIsOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}
              >
                &times;
              </button>
            </div>

            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1.5rem', paddingRight: '0.5rem' }}>
              {isLoading ? (
                <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.875rem' }}>Loading...</div>
              ) : notifications.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.875rem', padding: '2rem 0', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                  No notifications have been tracked for this asset yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {notifications.map(n => (
                     <div key={n.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.875rem' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                         <span>From: {n.sender_email}</span>
                         <span>{new Date(n.notified_at).toLocaleString()}</span>
                       </div>
                       <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>To: {n.recipient_email}</div>
                       {n.message && <div style={{ color: 'var(--foreground)', opacity: 0.9, marginTop: '0.5rem', borderLeft: '2px solid var(--primary)', paddingLeft: '0.5rem' }}>"{n.message}"</div>}
                     </div>
                  ))}
                </div>
              )}
            </div>

            <form id={`notify-form-${assetId}`} action={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 500, margin: 0 }}>Log New Notification</h3>
              
              {error && <div style={{ color: '#ef4444', fontSize: '0.875rem' }}>{error}</div>}
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--muted)' }}>Recipient Email</label>
                <input 
                  type="email" 
                  name="recipient_email" 
                  placeholder="client@example.com" 
                  required
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)', color: 'var(--foreground)' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--muted)' }}>Message (Optional)</label>
                <textarea 
                  name="message" 
                  placeholder="Review the generated drafted post here..." 
                  rows={3}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)', color: 'var(--foreground)', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)}
                  style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--border)', color: 'var(--foreground)', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isPending}
                  className="btn btn-primary"
                  style={{ padding: '0.5rem 1rem', borderRadius: '6px', opacity: isPending ? 0.7 : 1 }}
                >
                  {isPending ? 'Logging...' : 'Log Notification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
