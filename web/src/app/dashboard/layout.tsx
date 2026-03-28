import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'
import { logout } from '@/app/login/actions'
import { createClient } from '@/utils/supabase/server'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="dashboard-layout">
      {/* Persistent Glass Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
           <div className="logo-pulse" style={{ width: 32, height: 32, margin: 0, boxShadow: '0 0 15px rgba(139, 92, 246, 0.4)' }}></div>
           <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Agency Portal</h2>
        </div>
        
        <nav className="sidebar-nav">
          <Link href="/dashboard" className="nav-link">Overview</Link>
          <Link href="/dashboard/organizations" className="nav-link">Organizations</Link>
          <Link href="/dashboard/campaigns" className="nav-link">Campaigns</Link>
        </nav>

        {/* User Card & Settings */}
        <div style={{ padding: '1.5rem 0', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
           <div style={{ fontSize: '0.8rem', color: 'var(--muted)', wordBreak: 'break-all' }}>
             Logged in as<br />
             <strong style={{color: 'var(--foreground)'}}>{user?.email}</strong>
           </div>
           
           <ThemeToggle />
           
           <form action={logout}>
             <button type="submit" className="btn" style={{ width: '100%', background: 'var(--border)', color: 'var(--foreground)' }}>
               Sign Out
             </button>
           </form>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="dashboard-main">
        {children}
      </main>
    </div>
  )
}
