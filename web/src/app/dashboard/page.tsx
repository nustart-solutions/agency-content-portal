import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const revalidate = 0 // Opt out of Next.js caching to ensure realtime updates

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/')
  }

  // Check role to redirect brand users straight to their dashboard
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role, brand_id')
    .eq('user_id', user.id)
    .single()

  if (roleData?.role === 'brand_user' && roleData?.brand_id) {
    return redirect(`/dashboard/brands/${roleData.brand_id}`)
  }

  // 1. Fetch System Snapshot (Active Brands -> Campaigns -> Assets)
  const { data: brandsData, error } = await supabase
    .from('brands')
    .select(`
      id, name,
      campaign_groups (
        campaign_subgroups (
          campaigns (
            id, name,
            assets (id, title, status, google_doc_url, asset_type)
          )
        )
      )
    `)
    .order('name');

  const activeStatuses = ['draft', 'review', 'in_progress'];
  const brandsWithActivity: any[] = [];

  brandsData?.forEach(brand => {
    const brandCampaigns: any[] = [];
    brand.campaign_groups?.forEach((group: any) => {
      group.campaign_subgroups?.forEach((sub: any) => {
        sub.campaigns?.forEach((campaign: any) => {
          const activeAssets = campaign.assets?.filter((a: any) => activeStatuses.includes(a.status)) || [];
          if (activeAssets.length > 0) {
            brandCampaigns.push({
              id: campaign.id,
              name: campaign.name,
              assets: activeAssets
            });
          }
        });
      });
    });

    if (brandCampaigns.length > 0) {
      brandsWithActivity.push({
        id: brand.id,
        name: brand.name,
        campaigns: brandCampaigns
      });
    }
  });

  // 2. Fetch Recent Notifications
  const { data: notifsData } = await supabase
    .from('asset_notifications')
    .select(`
      id, sender_email, recipient_email, message, notified_at,
      assets (
        id, title,
        campaigns (
          id, name,
          campaign_subgroups (
            campaign_groups (
              brands (id, name)
            )
          )
        )
      )
    `)
    .order('notified_at', { ascending: false })
    .limit(20);

  return (
    <div style={{ padding: '2.5rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.025em' }}>Dashboard Overview</h1>
        <p style={{ color: 'var(--muted)', marginTop: '0.5rem' }}>View global metrics and recent activity across your agency.</p>
      </header>

      {/* STACKED LAYOUT */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        
        {/* SNAPSHOT WIDGET */}
        <section>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>Active Workflows by Brand</h2>
          {brandsWithActivity.length === 0 ? (
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
              No active assets found.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
              {brandsWithActivity.map(brand => (
                <div key={brand.id} className="glass-panel" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    {brand.name}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {brand.campaigns.map((camp: any) => (
                      <div key={camp.id}>
                        <Link href={`/dashboard/campaigns/${camp.id}`} style={{ fontWeight: 500, color: 'var(--brand-primary)', textDecoration: 'none', display: 'block', marginBottom: '0.25rem' }}>
                          {camp.name}
                        </Link>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {camp.assets.map((a: any) => (
                            <span key={a.id} style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--muted)' }}>
                              <span style={{ color: a.status === 'review' ? '#ffcc00' : 'inherit' }}>[{a.status}]</span> {a.title}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* RECENT NOTIFICATIONS WIDGET */}
        <section>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>Recent Notifications</h2>
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            {(!notifsData || notifsData.length === 0) ? (
              <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '1rem' }}>
                No recent notifications found.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="interactive-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                      <th style={{ padding: '1rem', color: 'var(--muted)', fontWeight: 500 }}>Time</th>
                      <th style={{ padding: '1rem', color: 'var(--muted)', fontWeight: 500 }}>From</th>
                      <th style={{ padding: '1rem', color: 'var(--muted)', fontWeight: 500 }}>Message</th>
                      <th style={{ padding: '1rem', color: 'var(--muted)', fontWeight: 500 }}>Asset / Campaign</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notifsData.map((notif: any) => {
                      const date = new Date(notif.notified_at).toLocaleString();
                      const asset = notif.assets?.[0] || notif.assets; // Supabase 1-to-many returns array; 1-to-1 returns object. Actually foreign key is asset_id -> assets(id), so returns object.
                      const camp = asset?.campaigns;
                      let brandName = "Unknown";
                      try {
                        brandName = camp?.campaign_subgroups?.campaign_groups?.brands?.name || "Unknown";
                      } catch(e) {}
                      
                      return (
                        <tr key={notif.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{date}</td>
                          <td style={{ padding: '1rem', fontSize: '0.85rem' }}>{notif.sender_email}</td>
                          <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                            <div style={{ maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {notif.message}
                            </div>
                          </td>
                          <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                            {asset && (
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <Link href={`/dashboard/assets/${asset.id}`} style={{ fontWeight: 500, color: 'var(--brand-primary)', textDecoration: 'none' }}>
                                  {brandName}: {asset.title}
                                </Link>
                                <span style={{ color: 'var(--muted)' }}>{camp?.name}</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  )
}
