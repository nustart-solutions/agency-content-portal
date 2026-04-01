import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CalendarView from './CalendarView'

export default async function BrandCalendarPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id: brandId } = await params
  const supabase = await createClient()

  // 1. Fetch Brand
  const { data: brand, error: brandError } = await supabase
    .from('brands')
    .select('id, name, organization_id, organizations(id, name)')
    .eq('id', brandId)
    .single()

  if (brandError || !brand) {
    redirect('/dashboard/organizations')
  }

  // 2. Fetch deeply nested tree to extract all assets
  const { data: groups } = await supabase
    .from('campaign_groups')
    .select(`
      campaign_subgroups (
        campaigns (
          id, name, target_publish_date,
          assets ( id, asset_type, channel, status, published_at )
        )
      )
    `)
    .eq('brand_id', brandId)

  const events: any[] = []

  if (groups) {
    groups.forEach((g: any) => {
      g.campaign_subgroups?.forEach((sg: any) => {
        sg.campaigns?.forEach((c: any) => {
          c.assets?.forEach((a: any) => {
            const isPublished = a.status === 'published'
            
            // Prioritize published_at for actual execution, otherwise fallback to target date
            let eventDate = isPublished ? a.published_at : c.target_publish_date
            
            if (eventDate) {
              events.push({
                id: a.id,
                campaignName: c.name,
                channel: a.channel || a.asset_type || 'Unknown Channel',
                status: a.status,
                date: new Date(eventDate).toISOString(),
                isPublished: isPublished
              })
            }
          })
        })
      })
    })
  }

  return (
    <div className="section-container">
      <div className="section-header" style={{ marginBottom: '2rem' }}>
        <div className="breadcrumb">
          <Link href={`/dashboard/brands/${brandId}`} className="back-link">
            &larr; Back to {brand.name} Dashboard
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h1 className="page-title">{brand.name} Content Calendar</h1>
          </div>
        </div>
      </div>
      
      <p className="section-description" style={{ marginBottom: '2.5rem' }}>
        A visual timeline of all assets scheduled and published for this brand. 
        <span style={{ color: '#4ade80', marginLeft: '0.5rem' }}>Green = Published</span>, 
        <span style={{ color: '#9ca3af', marginLeft: '0.5rem' }}>Grey = Scheduled Target Date</span>.
      </p>

      <CalendarView initialEvents={events} />
    </div>
  )
}
