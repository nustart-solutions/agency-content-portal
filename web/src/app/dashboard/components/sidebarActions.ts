'use server'

import { createClient } from '@/utils/supabase/server'

export async function getBrandTaxonomy(brandId: string) {
  const supabase = await createClient()

  // We need to fetch Groups -> Subgroups -> Campaigns with their asset counts
  const { data: groups, error } = await supabase
    .from('campaign_groups')
    .select(`
      *,
      campaign_subgroups (
        *,
        campaigns (
          *,
          assets ( id )
        )
      )
    `)
    .eq('brand_id', brandId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching taxonomy for sidebar:', error)
    // Actually throw the error to pass the message to the Client Component so we can read it on the frontend.
    throw new Error(error.message)
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
  
  // Depending on how Supabase types the 1-to-many relationship in TypeScript, it may return as an array or object
  try {
    const subgroup = Array.isArray(data.campaign_subgroups) ? data.campaign_subgroups[0] : data.campaign_subgroups;
    if (!subgroup) return null;
    
    // @ts-ignore - Supabase type generation doesn't always nail deep relations
    const group = Array.isArray(subgroup.campaign_groups) ? subgroup.campaign_groups[0] : subgroup.campaign_groups;
    return group?.brand_id || null;
  } catch(e) {
    return null;
  }
}
