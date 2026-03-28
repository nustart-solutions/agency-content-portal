import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { logout } from '@/app/login/actions'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/')
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', padding: '2rem' }}>
        <h2>Agency Portal</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Logged in as {user.email}</span>
          <form action={logout}>
            <button type="submit" style={{ background: 'var(--glass-border)', color: 'white', padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid var(--glass-border)' }}>
              Sign Out
            </button>
          </form>
        </div>
      </header>

      <main style={{ padding: '0 2rem' }}>
        <div style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '2rem' }}>
          <h3>Welcome to your Dashboard</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>
            We've securely verified your session using Supabase Server-Side authentication. 
            From here, you will manage your Brands, Campaign Groups, and AI generated content.
          </p>
        </div>
      </main>
    </div>
  )
}
