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
          assets ( id, title, is_anchor, asset_type, status, published_url, published_at, created_at )
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

  // 4. Calculate high-level metrics for the new clean dashboard
  const totalGroups = sortedGroups.length;
  let totalSubgroups = 0;
  let totalCampaigns = 0;
  let totalAssets = 0;
  
  sortedGroups.forEach((g: any) => {
    totalSubgroups += g.campaign_subgroups?.length || 0;
    g.campaign_subgroups?.forEach((sg: any) => {
      totalCampaigns += sg.campaigns?.length || 0;
      sg.campaigns?.forEach((c: any) => {
        totalAssets += c.assets?.length || 0;
      });
    });
  });

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
        Welcome to the {brand.name} dashboard. Use the sidebar to navigate your content pipeline.
      </p>

      {/* High-Level Overview Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem' }}>{totalGroups}</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Groups</div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem' }}>{totalSubgroups}</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subgroups</div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem' }}>{totalCampaigns}</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Campaigns</div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem' }}>{totalAssets}</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assets Tracked</div>
        </div>
      </div>

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

    </div>
  )
}
