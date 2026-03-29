import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { AssetEditor } from './AssetEditor'

export default async function AssetPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id: assetId } = await params
  const supabase = await createClient()

  // 1. Fetch user role to determine if they get to see the secret Execution transparency layer
  const { data: { user } } = await supabase.auth.getUser()
  let userRole = null
  if (user) {
    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single()
    if (roleData) {
      userRole = roleData.role
    }
  }

  // 2. Fetch Asset details with deeply nested breadcrumb data
  const { data: asset, error: assetError } = await supabase
    .from('assets')
    .select('*, campaigns(id, name, campaign_subgroups(name, campaign_groups(name, brand_id, brands(name))))')
    .eq('id', assetId)
    .single()

  if (assetError || !asset) {
    return <div style={{ padding: '2.5rem', color: '#ef4444' }}>Asset not found or you don't have access.</div>
  }

  const campaign = asset.campaigns
  const campaignId = campaign?.id
  const campaignName = campaign?.name
  const subGroupName = campaign?.campaign_subgroups?.name
  const groupName = campaign?.campaign_subgroups?.campaign_groups?.name
  const brandName = campaign?.campaign_subgroups?.campaign_groups?.brands?.name
  const brandId = campaign?.campaign_subgroups?.campaign_groups?.brand_id

  return (
    <div style={{ padding: '2.5rem' }}>
      <header style={{ marginBottom: '2.5rem' }}>
        <div style={{ fontSize: '0.875rem', color: 'var(--primary)', marginBottom: '0.75rem', fontWeight: 500, display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <Link href={`/dashboard/brands/${brandId}`} style={{ textDecoration: 'none', color: 'inherit', opacity: 0.8 }}>
            {brandName}
          </Link> 
          <span style={{ color: 'var(--muted)' }}>&gt;</span> 
          <span style={{ opacity: 0.8 }}>{groupName}</span>
          <span style={{ color: 'var(--muted)' }}>&gt;</span> 
          <span style={{ opacity: 0.8 }}>{subGroupName}</span>
          <span style={{ color: 'var(--muted)' }}>&gt;</span> 
          <Link href={`/dashboard/campaigns/${campaignId}`} style={{ textDecoration: 'none', color: 'inherit', fontWeight: 600 }}>
            {campaignName}
          </Link>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.025em' }}>{asset.title}</h1>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
              <span style={{ background: 'var(--glass-bg)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', border: '1px solid var(--border)', color: 'var(--muted)' }}>
                {asset.asset_type}
              </span>
              <span style={{ background: 'var(--glass-bg)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', border: '1px solid var(--border)', color: 'var(--muted)' }}>
                {asset.channel}
              </span>
              <span style={{ background: asset.status === 'published' ? 'rgba(16, 185, 129, 0.1)' : 'var(--border)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', color: asset.status === 'published' ? '#10b981' : 'var(--foreground)' }}>
                Status: {asset.status}
              </span>
            </div>
            {asset.wordpress_post_url && (
              <div style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>
                <a href={asset.wordpress_post_url} target="_blank" rel="noopener noreferrer" style={{ color: '#00a3ff', textDecoration: 'underline' }}>
                  View Published Article ↗
                </a>
              </div>
            )}
          </div>
          {asset.google_doc_url && (
            <a 
              href={asset.google_doc_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: '#4285F4',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: 500,
                fontSize: '0.875rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              Open in Google Docs
            </a>
          )}
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: userRole === 'agency_admin' ? '2fr 1fr' : '1fr', gap: '2rem' }}>
        
        {/* Main Content Viewer */}
        <AssetEditor asset={asset} />

        {/* AI Transparency Log */}
          <div className="glass-panel" style={{ padding: '2rem', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.03)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', borderBottom: '1px solid rgba(139, 92, 246, 0.2)', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem' }}>🔍</span> Execution Log
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              This panel displays the exact synthesized prompt passed to the modal pipeline for validation and debugging.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.05em' }}>Compiled Prompt payload</label>
                  {asset.compiled_prompt ? (
                    <pre style={{ 
                      marginTop: '0.5rem', 
                      padding: '1rem', 
                      background: '#1e1e1e', 
                      borderRadius: '6px', 
                      border: '1px solid var(--border)',
                      fontSize: '0.75rem',
                      color: '#d4d4d4',
                      overflowX: 'auto',
                      whiteSpace: 'pre-wrap',
                      maxHeight: '400px',
                      overflowY: 'auto',
                      lineHeight: '1.5'
                    }}>
                      {asset.compiled_prompt}
                    </pre>
                  ) : (
                    <div style={{ marginTop: '0.5rem', padding: '1rem', background: 'rgba(0,0,0,0.1)', border: '1px dashed var(--border)', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--muted)', textAlign: 'center' }}>
                      Prompt context not yet collected.
                    </div>
                  )}
               </div>
            </div>
          </div>

      </div>
    </div>
  )
}
