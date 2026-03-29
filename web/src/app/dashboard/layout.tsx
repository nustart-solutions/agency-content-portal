import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'
import { logout } from '@/app/login/actions'
import { createClient } from '@/utils/supabase/server'
import SidebarNav from './components/SidebarNav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userRole = null
  let userBrandId = null

  if (user) {
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role, brand_id')
      .eq('user_id', user.id)
      .single()
      
    if (roleData) {
      userRole = roleData.role
      userBrandId = roleData.brand_id
    }
  }

  return (
    <div className="dashboard-layout">
      {/* Persistent Glass Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center' }}>
           <img src="https://nustart.solutions/wp-content/uploads/2026/03/VA-darktheme.png" alt="ValueArc Agency Portal" className="sidebar-logo-img sidebar-logo-dark" />
           <img src="https://nustart.solutions/wp-content/uploads/2026/03/VA-light-theme.png" alt="ValueArc Agency Portal" className="sidebar-logo-img sidebar-logo-light" />
        </div>
        
        <SidebarNav userRole={userRole} userBrandId={userBrandId} />

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
