'use server'

import { createClient } from '@/utils/supabase/server'

export async function getBrandTaxonomy(brandId: string) {
  const supabase = await createClient()

  // We need to fetch Groups -> Subgroups -> Campaigns with their asset counts
  const { data: groups, error } = await supabase
    .from('campaign_groups')
    .select(`
      id,
      name,
      campaign_subgroups (
        id,
        name,
        campaigns (
          id,
          name,
          status,
          assets ( id )
        )
      )
    `)
    .eq('brand_id', brandId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching taxonomy for sidebar:', error)
    return null
  }

  // Deeply sort the returned nested data by created_at or name if applicable, 
  // currently we just rely on Supabase returning them in default DB order or we can sort them logically.
  return groups
}

// Helper to find the Brand ID if we only know the Campaign ID (e.g. user lands on /dashboard/campaigns/[id])
export async function getBrandIdFromCampaign(campaignId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('campaigns')
    .select(`
      campaign_subgroups (
        campaign_groups (
          brand_id
        )
      )
    `)
    .eq('id', campaignId)
    .single()

  if (error || !data) return null
  
  return data.campaign_subgroups?.campaign_groups?.brand_id || null
}
