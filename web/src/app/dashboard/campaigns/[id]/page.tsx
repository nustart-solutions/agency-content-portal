import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import CreateAssetModal from './CreateAssetModal'
import AssetStatusSelect from './AssetStatusSelect'

export default async function CampaignPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id: campaignId } = await params
  const supabase = await createClient()

  // Fetch Campaign details
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .select('*, campaign_subgroups(name, campaign_group_id, campaign_groups(name, brand_id, brands(name)))')
    .eq('id', campaignId)
    .single()

  if (campaignError || !campaign) {
    return <div style={{ padding: '2.5rem', color: '#ef4444' }}>Campaign not found or you don't have access.</div>
  }

  // Fetch Assets
  const { data: assets, error: assetsError } = await supabase
    .from('assets')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false })

  const anchorAssets = assets?.filter(a => a.is_anchor) || []
  const supportAssets = assets?.filter(a => !a.is_anchor) || []

  // Breadcrumb details
  const subGroupName = campaign.campaign_subgroups?.name
  const groupName = campaign.campaign_subgroups?.campaign_groups?.name
  const brandName = campaign.campaign_subgroups?.campaign_groups?.brands?.name
  const brandId = campaign.campaign_subgroups?.campaign_groups?.brand_id

  return (
    <div style={{ padding: '2.5rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
        <div>
          <div style={{ fontSize: '0.875rem', color: 'var(--primary)', marginBottom: '0.5rem', fontWeight: 500 }}>
            <Link href={`/dashboard/brands/${brandId}`} style={{ textDecoration: 'none', color: 'inherit', opacity: 0.8 }}>
              {brandName}
            </Link> 
            <span style={{ margin: '0 0.5rem', color: 'var(--muted)' }}>&gt;</span> 
            {groupName} 
            <span style={{ margin: '0 0.5rem', color: 'var(--muted)' }}>&gt;</span> 
            {subGroupName}
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.025em' }}>{campaign.name}</h1>
          <p style={{ color: 'var(--muted)', marginTop: '0.5rem' }}>
            Target Publish: {campaign.target_publish_date ? new Date(campaign.target_publish_date).toLocaleDateString() : 'TBD'}
          </p>
        </div>
        <CreateAssetModal campaignId={campaign.id} />
      </header>

      {assetsError && <div style={{ color: '#ef4444', marginBottom: '1rem' }}>Error loading assets: {assetsError.message}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* Anchor Assets */}
        <section className="glass-panel" style={{ padding: '2rem', borderRadius: '12px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            Anchor Assets (Cornerstone)
          </h2>
          
          {anchorAssets.length === 0 ? (
            <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '2rem 0', fontSize: '0.875rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
              No anchor assets yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {anchorAssets.map(asset => (
                <div key={asset.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 500 }}>{asset.title}</h3>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.35rem', display: 'flex', gap: '0.5rem' }}>
                      <span style={{ background: 'var(--glass-bg)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                        {asset.asset_type.replace('_', ' ').toUpperCase()}
                      </span>
                      <span style={{ background: 'var(--glass-bg)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                        {asset.channel.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <AssetStatusSelect assetId={asset.id} campaignId={campaign.id} currentStatus={asset.status} />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Support Assets */}
        <section className="glass-panel" style={{ padding: '2rem', borderRadius: '12px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            Support Assets (Distribution)
          </h2>

          {supportAssets.length === 0 ? (
            <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '2rem 0', fontSize: '0.875rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
              No support assets yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {supportAssets.map(asset => (
                <div key={asset.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 500 }}>{asset.title}</h3>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.35rem', display: 'flex', gap: '0.5rem' }}>
                      <span style={{ background: 'var(--glass-bg)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                        {asset.asset_type.replace('_', ' ').toUpperCase()}
                      </span>
                      <span style={{ background: 'var(--glass-bg)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                        {asset.channel.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <AssetStatusSelect assetId={asset.id} campaignId={campaign.id} currentStatus={asset.status} />
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}
