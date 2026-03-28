import { createClient } from '@/utils/supabase/server'
import CreateOrgModal from './CreateOrgModal'

export default async function OrganizationsPage() {
  const supabase = await createClient()
  
  // RLS will magically only return Orgs this exact user is authorized to see!
  const { data: orgs, error } = await supabase
    .from('organizations')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div style={{ padding: '2.5rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.025em' }}>Organizations</h1>
          <p style={{ color: 'var(--muted)', marginTop: '0.5rem' }}>Manage top-level agency clients and their mapped brands.</p>
        </div>
        
        {/* Client Component injected inside a Server Component */}
        <CreateOrgModal />
      </header>

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '0.5rem', color: '#ef4444', marginBottom: '2rem' }}>
          Notice: {error.message}. (Did you run the SQL script to promote your user to agency_admin?)
        </div>
      )}

      {/* Highly responsive CSS Grid for Premium Glass Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {orgs?.map(org => (
          <div key={org.id} className="glass-panel org-card">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 500 }}>{org.name}</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', fontSize: '0.85rem', color: 'var(--muted)' }}>
              <span style={{ fontFamily: 'monospace' }}>ID: {org.id.split('-')[0]}...</span>
              <span style={{ color: 'var(--primary)', fontWeight: 500 }}>Manage Brands &rarr;</span>
            </div>
          </div>
        ))}
        
        {orgs?.length === 0 && !error && (
          <div style={{ gridColumn: '1 / -1', padding: '5rem 2rem', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: '1rem', color: 'var(--muted)' }}>
            No organizations found. Click "+ New Organization" above to create your very first portfolio client.
          </div>
        )}
      </div>

      <style jsx>{`
        .org-card {
          padding: 1.75rem; 
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); 
          cursor: pointer;
        }
        .org-card:hover {
          transform: translateY(-4px);
          border-color: var(--primary);
          box-shadow: 0 10px 30px -10px rgba(139, 92, 246, 0.3);
        }
      `}</style>
    </div>
  )
}
