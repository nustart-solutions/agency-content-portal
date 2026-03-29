import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CreateGroupModal from './CreateGroupModal'
import CreateSubgroupModal from './CreateSubgroupModal'
import CreateCampaignModal from './CreateCampaignModal'
import AddBrandContextModal from './AddBrandContextModal'
import EditBrandContextModal from './EditBrandContextModal'
import EditBrandModal from './EditBrandModal'
import SpiderWebsiteButton from './SpiderWebsiteButton'
import Scoreboard from '@/components/Scoreboard'

export default async function BrandDashboardPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id: brandId } = await params
  const supabase = await createClient()

  // 0. Check User Role for UI permissions
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id

  let isAgencyAdmin = false
  if (userId) {
    const { data: hasAdminAccess, error } = await supabase
      .rpc('is_agency_admin', { check_user_id: userId })
      
    if (hasAdminAccess) {
      isAgencyAdmin = true
    } else if (error) {
      console.error('RPC check for agency_admin failed:', error)
    }
  }

  // 1. Fetch Brand & verify access
  const { data: brand, error: brandError } = await supabase
    .from('brands')
    .select('*, organizations(id, name)')
    .eq('id', brandId)
    .single()

  if (brandError || !brand) {
    redirect('/dashboard/organizations')
  }

  // 2. Fetch entire 3-tier deep taxonomy in one highly optimized query!
  const { data: groups } = await supabase
    .from('campaign_groups')
    .select(`
      *,
      campaign_subgroups (
        *,
        campaigns (
          *,
          assets ( id, title, is_anchor, asset_type, status, wordpress_post_url, published_at, created_at )
        )
      )
    `)
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false })

  // 3. Fetch specific Brand Context elements
  const { data: brandContexts } = await supabase
    .from('brand_contexts')
    .select('*')
    .eq('brand_id', brandId)
    .order('context_type', { ascending: true })

  // Sort nested items in JavaScript to ensure consistent chronological display
  const sortedGroups = groups?.map((g: any) => {
    return {
      ...g,
      campaign_subgroups: (g.campaign_subgroups || [])
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .map((sg: any) => ({
          ...sg,
          campaigns: (sg.campaigns || [])
            .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        }))
    }
  }) || [];

  return (
    <div className="section-container">
      <div className="section-header">
        <div className="breadcrumb">
          <Link href={`/dashboard/organizations/${brand.organization_id}`} className="back-link">
            &larr; Back to {brand.organizations?.name || 'Organization'}
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {brand.logo_url && (
              <img 
                src={brand.logo_url} 
                alt={`${brand.name} logo`} 
                style={{ height: '36px', width: 'auto', borderRadius: '6px', objectFit: 'contain' }} 
              />
            )}
            <h1 className="page-title">{brand.name} Dashboard</h1>
            <EditBrandModal 
              brand={{
                id: brand.id,
                name: brand.name,
                logo_url: brand.logo_url,
                website_url: brand.website_url,
                requires_approval: brand.requires_approval
              }} 
              isAgencyAdmin={isAgencyAdmin}
            />
          </div>
        </div>
        <CreateGroupModal brandId={brandId} />
      </div>

      <p className="section-description" style={{ marginBottom: '2.5rem' }}>
        Manage the unified master taxonomy of Groups, Subgroups, and active Campaigns for this brand.
      </p>

      {/* Global Scoreboard Render */}
      <Scoreboard brandId={brandId} />

      {/* Brand Intelligence Context Section */}
      <div style={{ marginTop: '2.5rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Knowledge Bank</h2>
            <SpiderWebsiteButton brandId={brandId} websiteUrl={brand.website_url} contextStatus={brand.context_status} />
          </div>
          <AddBrandContextModal brandId={brandId} />
        </div>
        
        {(!brandContexts || brandContexts.length === 0) ? (
          <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--muted)' }}>
            No background context available yet. The AI pipeline won't have tone guidelines!
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            {brandContexts.map((ctx: any) => (
              <div key={ctx.id} className="glass-panel" style={{ padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <strong style={{ display: 'block', color: 'var(--primary)', fontSize: '1.2rem' }}>{ctx.context_type}</strong>
                <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                  <div style={{ marginBottom: '0.2rem' }}>Updated: {new Date(ctx.created_at).toLocaleDateString()}</div>
                  <div style={{ marginBottom: '0.5rem' }}>Chars: {ctx.content_markdown?.length?.toLocaleString() || 0}</div>
                  <EditBrandContextModal context={ctx} brandId={brandId} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Master Content Pipeline Taxonomy */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Content Pipeline</h2>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {(!sortedGroups || sortedGroups.length === 0) ? (
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
              No Groups created. Start by organizing the strategy.
            </div>
          ) : (
            sortedGroups.map((group: any) => (
              <details key={group.id} open className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <summary style={{ fontSize: '1.2rem', fontWeight: 600, cursor: 'pointer', outline: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Campaign Group: {group.name}</span>
                  <CreateSubgroupModal brandId={brandId} groupId={group.id} />
                </summary>
                
                <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', paddingLeft: '1rem', borderLeft: '2px solid var(--border)' }}>
                  {(!group.campaign_subgroups || group.campaign_subgroups.length === 0) ? (
                    <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>No subgroups exist yet.</p>
                  ) : (
                    group.campaign_subgroups.map((subgroup: any) => (
                      <details key={subgroup.id} open style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <summary style={{ fontSize: '1rem', fontWeight: 500, cursor: 'pointer', outline: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>↳ {subgroup.name}</span>
                          <CreateCampaignModal brandId={brandId} subgroupId={subgroup.id} />
                        </summary>

                        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {(!subgroup.campaigns || subgroup.campaigns.length === 0) ? (
                            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No active campaigns.</p>
                          ) : (
                            subgroup.campaigns.map((camp: any) => {
                              // Find any published anchor asset (has URL or is marked published)
                              const publishedAnchor = camp.assets?.find((a: any) => 
                                (a.is_anchor || a.asset_type?.includes('anchor') || a.asset_type === 'blog_post') && 
                                (a.wordpress_post_url || a.status === 'published' || a.status === 'staged')
                              );

                              // Fallback: If no strict anchor matched, but there IS an asset with a WP URL, show that.
                              const fallbackPublished = publishedAnchor || camp.assets?.find((a: any) => !!a.wordpress_post_url);
                              const finalDisplayAsset = fallbackPublished;

                              return (
                            <Link href={`/dashboard/campaigns/${camp.id}`} key={camp.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'var(--glass-bg)', border: '1px solid var(--border)', borderRadius: '6px', textDecoration: 'none', color: 'inherit' }}>
                              <div style={{ flex: 1, minWidth: 0, paddingRight: '1rem' }}>
                                <strong style={{ display: 'block', marginBottom: '0.25rem' }}>{camp.name}</strong>
                                
                                {finalDisplayAsset?.wordpress_post_url ? (
                                  <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                    <span style={{ color: 'var(--text-color)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                                      {finalDisplayAsset.title}
                                    </span>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                      <span style={{ color: 'var(--primary)' }}>
                                        Published: {finalDisplayAsset.published_at || finalDisplayAsset.created_at ? new Date(finalDisplayAsset.published_at || finalDisplayAsset.created_at).toLocaleDateString() : 'TBD'}
                                      </span>
                                      <a 
                                        href={finalDisplayAsset.wordpress_post_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        style={{ color: '#00a3ff', textDecoration: 'underline', fontWeight: 500 }}
                                        onClick={(e) => e.stopPropagation()} // Prevent triggering the Link wrapper
                                      >
                                        View Live ↗
                                      </a>
                                    </div>
                                  </div>
                                ) : (
                                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                                    Target: {camp.target_publish_date ? new Date(camp.target_publish_date).toLocaleDateString() : 'TBD'}
                                  </span>
                                )}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                                  {camp.assets?.length || 0} Assets
                                </span>
                                <span style={{ color: 'var(--primary)', fontSize: '1.2rem' }}>&rarr;</span>
                              </div>
                            </Link>
                          )})
                        )}
                      </div>
                    </details>
                  ))
                )}
              </div>
              </details>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
