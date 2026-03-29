import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export default async function SubgroupPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id: subgroupId } = await params
  const supabase = await createClient()

  // Fetch Subgroup details
  const { data: subgroup, error: subgroupError } = await supabase
    .from('campaign_subgroups')
    .select('*, campaign_groups(name, brand_id, brands(name))')
    .eq('id', subgroupId)
    .single()

  if (subgroupError || !subgroup) {
    return <div style={{ padding: '2.5rem', color: '#ef4444' }}>Subgroup not found or you don't have access.</div>
  }

  // Fetch Campaigns and nested Assets
  const { data: campaigns, error: campaignsError } = await supabase
    .from('campaigns')
    .select('id, name, target_publish_date, created_at, assets(*)')
    .eq('campaign_subgroup_id', subgroupId)
    .order('created_at', { ascending: false })

  const groupName = subgroup.campaign_groups?.name
  const brandName = subgroup.campaign_groups?.brands?.name
  const brandId = subgroup.campaign_groups?.brand_id

  return (
    <div style={{ padding: '2.5rem' }}>
      <header style={{ marginBottom: '2.5rem' }}>
        <div style={{ fontSize: '0.875rem', color: 'var(--primary)', marginBottom: '0.5rem', fontWeight: 500, display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <Link href={`/dashboard/brands/${brandId}`} style={{ textDecoration: 'none', color: 'inherit', opacity: 0.8 }}>
            {brandName}
          </Link> 
          <span style={{ color: 'var(--muted)' }}>&gt;</span> 
          <Link href={`/dashboard/brands/${brandId}`} style={{ textDecoration: 'none', color: 'inherit', opacity: 0.8 }}>
            {groupName} 
          </Link>
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 600, letterSpacing: '-0.025em', color: 'var(--foreground)' }}>
          {subgroup.name} Campaigns
        </h1>
        <p style={{ color: 'var(--muted)', marginTop: '0.5rem', maxWidth: '600px', lineHeight: 1.5 }}>
          View all active campaigns and associated published content within the {subgroup.name} scope.
        </p>
      </header>

      {campaignsError && (
        <div style={{ color: '#ef4444', marginBottom: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
          Error loading campaigns: {campaignsError.message}
        </div>
      )}

      {(!campaigns || campaigns.length === 0) ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)', borderRadius: '12px' }}>
          No campaigns found in this subgroup. Campaigns need to be created via the main Brand Dashboard.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {campaigns.map((campaign: any) => {
            const assets = campaign.assets || []
            
            return (
              <section key={campaign.id} className="glass-panel" style={{ padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>
                      <Link href={`/dashboard/campaigns/${campaign.id}`} style={{ color: 'inherit', textDecoration: 'none' }} className="hover:opacity-80">
                        {campaign.name}
                      </Link>
                    </h2>
                    <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.5rem', display: 'flex', gap: '1rem' }}>
                      <span>Target: {campaign.target_publish_date ? new Date(campaign.target_publish_date).toLocaleDateString() : 'TBD'}</span>
                      <span>Total Assets: {assets.length}</span>
                    </div>
                  </div>
                  <Link href={`/dashboard/campaigns/${campaign.id}`} style={{ padding: '0.5rem 1rem', background: 'var(--primary)', color: '#fff', borderRadius: '6px', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }} className="hover:opacity-90 transition-opacity">
                    Manage Campaign
                  </Link>
                </div>

                {assets.length === 0 ? (
                  <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '1.5rem 0', fontSize: '0.875rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                    No assets linked to this campaign.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {assets.map((asset: any) => (
                      <div key={asset.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <div>
                          <h3 style={{ fontSize: '1rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {asset.is_anchor && <span title="Anchor Asset" style={{ color: 'var(--primary)' }}>★</span>}
                            {asset.title}
                          </h3>
                          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.45rem', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <span style={{ background: 'var(--glass-bg)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                              {asset.asset_type.replace('_', ' ').toUpperCase()}
                            </span>
                            <span style={{ background: 'var(--glass-bg)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                              {asset.channel.replace('_', ' ').toUpperCase()}
                            </span>
                            {asset.status === 'published' && (
                              <span style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                                PUBLISHED
                              </span>
                            )}
                            
                            {/* Document & Published Links */}
                            {asset.google_doc_url && (
                              <a href={asset.google_doc_url} target="_blank" rel="noopener noreferrer" title="Open Google Doc" className="hover:opacity-80 transition-opacity" style={{ color: '#4285F4', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '0.5rem', fontWeight: 500 }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                                Doc
                              </a>
                            )}
                            {(asset.published_url || asset.wordpress_post_url) && (
                              <a href={asset.published_url || asset.wordpress_post_url} target="_blank" rel="noopener noreferrer" title="View Published Article" className="hover:opacity-80 transition-opacity" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '0.5rem', fontWeight: 600 }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                                View Published Article
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
