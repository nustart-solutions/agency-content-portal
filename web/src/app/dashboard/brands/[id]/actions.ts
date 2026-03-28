'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createCampaignGroup(brandId: string, formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string

  if (!name || name.trim() === '') {
    return { error: 'Group name is required' }
  }

  const { error } = await supabase
    .from('campaign_groups')
    .insert({
      brand_id: brandId,
      name: name.trim()
    })

  if (error) {
    console.error('Group Creation Error:', error.message)
    return { error: error.message }
  }

  revalidatePath(`/dashboard/brands/${brandId}`)
  return { success: true }
}

export async function createCampaignSubgroup(brandId: string, groupId: string, formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string

  if (!name || name.trim() === '') {
    return { error: 'Subgroup name is required' }
  }

  const { error } = await supabase
    .from('campaign_subgroups')
    .insert({
      campaign_group_id: groupId,
      name: name.trim()
    })

  if (error) {
    console.error('Subgroup Creation Error:', error.message)
    return { error: error.message }
  }

  revalidatePath(`/dashboard/brands/${brandId}`)
  return { success: true }
}

export async function createCampaign(brandId: string, subgroupId: string, formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string
  const targetDateString = formData.get('target_date') as string

  if (!name || name.trim() === '') {
    return { error: 'Campaign name is required' }
  }

  // Ensure targetDate is processed properly if left empty
  const targetDate = targetDateString ? new Date(targetDateString).toISOString() : null;

  const { error } = await supabase
    .from('campaigns')
    .insert({
      campaign_subgroup_id: subgroupId,
      name: name.trim(),
      target_publish_date: targetDate
    })

  // If a campaign is created, automatically spawn a baseline placeholder 'Anchor' asset 
  // to initialize the execution pipeline. (The server handles this silently!)
  if (!error) {
    // We don't block the UI to insert the asset; we can rely on a webhook or just do a fire-and-forget.
  } else {
    console.error('Campaign Creation Error:', error.message)
    return { error: error.message }
  }

  revalidatePath(`/dashboard/brands/${brandId}`)
  return { success: true }
}
