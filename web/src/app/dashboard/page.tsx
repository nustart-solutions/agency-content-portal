import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/')
  }

  return (
    <div style={{ padding: '2.5rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.025em' }}>Dashboard Overview</h1>
        <p style={{ color: 'var(--muted)', marginTop: '0.5rem' }}>View global metrics and recent activity across your agency.</p>
      </header>

      <div className="glass-panel" style={{ padding: '2rem', marginTop: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 500, marginBottom: '1rem' }}>Welcome aboard, {user.email}</h3>
        <p style={{ color: 'var(--muted)', lineHeight: '1.6' }}>
          This is the central command center for your entire Content CRM. Because we built your portal using strict architectural layers, this frontend only serves as a beautiful interactive viewer for the data securely managed by Supabase.
        </p>
      </div>
    </div>
  )
}
