import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export default async function CampaignsPage() {
  const supabase = await createClient()
  
  // Fetches all campaigns across all authorized brands via RLS
  const { data: campaigns, error } = await supabase
    .from('campaigns')
    .select('*, campaign_subgroups(name, campaign_groups(name, brands(name)))')
    .order('created_at', { ascending: false })

  return (
    <div style={{ padding: '2.5rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.025em' }}>Campaigns</h1>
          <p style={{ color: 'var(--muted)', marginTop: '0.5rem' }}>Global pipeline view of all content generation runs.</p>
        </div>
        <button className="btn btn-primary">+ New Campaign</button>
      </header>

      {error ? (
        <div style={{ color: '#ef4444' }}>{error.message}</div>
      ) : (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          {campaigns?.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem 0' }}>
              No campaigns running yet. You must create an Organization, Brand, Campaign Group, and Subgroup first before launching a Campaign.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {campaigns?.map(camp => (
                <Link key={camp.id} href={`/dashboard/campaigns/${camp.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                    <div>
                      <strong style={{ display: 'block' }}>{camp.name}</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                        Brand: {camp.campaign_subgroups?.campaign_groups?.brands?.name || 'Unknown'} | Group: {camp.campaign_subgroups?.campaign_groups?.name || 'Unknown'} | Subgroup: {camp.campaign_subgroups?.name || 'Unknown'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
