import { createClient } from '@/utils/supabase/server'

export default async function Scoreboard({ brandId }: { brandId?: string }) {
  const supabase = await createClient()

  // Fetch all assets with nested relations to determine brand
  const { data: allAssets, error } = await supabase
    .from('assets')
    .select(`
      id,
      created_at,
      approved_at,
      published_at,
      status,
      campaigns (
        campaign_subgroups (
          campaign_groups (
            brand_id
          )
        )
      )
    `)

  if (error || !allAssets) {
    return null
  }

  // Filter by brand if a brandId is provided
  const assets = brandId 
    ? allAssets.filter((a: any) => {
        const bId = a.campaigns?.campaign_subgroups?.campaign_groups?.brand_id
        return bId === brandId
      })
    : allAssets

  // Math 1: Assets in Pipeline (Draft, Progress, Review)
  const pipelineCount = assets.filter((a: any) => ['draft', 'in_progress', 'review'].includes(a.status)).length

  // Math 2: Assets Published This Month
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  
  const publishedThisMonthCount = assets.filter((a: any) => {
    if (a.status !== 'published' || !a.published_at) return false
    const d = new Date(a.published_at)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  }).length

  // Math 3: Average Approval Time in Days
  let totalApprovalMsec = 0
  let approvedCount = 0

  assets.forEach((a: any) => {
    if (a.approved_at && a.created_at) {
      const created = new Date(a.created_at).getTime()
      const approved = new Date(a.approved_at).getTime()
      const ms = approved - created
      if (ms >= 0) {
         totalApprovalMsec += ms
         approvedCount++
      }
    }
  })

  // Convert avg ms to days (1 day = 86400000 ms)
  const avgApprovalDays = approvedCount > 0 
    ? (totalApprovalMsec / approvedCount / 86400000).toFixed(1) 
    : 'N/A'

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', borderLeft: '4px solid var(--primary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Pipeline Assets</span>
        <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--foreground)' }}>{pipelineCount}</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Currently in production</span>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', borderLeft: '4px solid var(--accent-light)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Avg. Approval Time</span>
        <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--foreground)' }}>{avgApprovalDays} {avgApprovalDays !== 'N/A' && <span style={{fontSize: '1rem', fontWeight: 500}}>days</span>}</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Speed to approve an asset</span>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', borderLeft: '4px solid #10b981', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Published This Month</span>
        <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--foreground)' }}>{publishedThisMonthCount}</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Assets successfully released</span>
      </div>
    </div>
  )
}
