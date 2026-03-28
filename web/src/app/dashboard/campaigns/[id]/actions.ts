'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createAsset(campaignId: string, formData: FormData) {
  const supabase = await createClient()
  
  const title = formData.get('title') as string
  const asset_type = formData.get('asset_type') as string
  const channel = formData.get('channel') as string
  const is_anchor = formData.get('is_anchor') === 'on'

  if (!title || !asset_type || !channel) {
    return { error: 'Missing required fields' }
  }

  const { error } = await supabase
    .from('assets')
    .insert({
      campaign_id: campaignId,
      title,
      asset_type,
      channel,
      is_anchor,
      status: 'draft'
    })

  if (error) {
    console.error('Error creating asset:', error)
    return { error: error.message }
  }

  revalidatePath(`/dashboard/campaigns/${campaignId}`)
  return { success: true }
}

export async function updateAssetStatus(assetId: string, campaignId: string, newStatus: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('assets')
    .update({ status: newStatus })
    .eq('id', assetId)

  if (error) {
    console.error('Error updating asset status:', error)
    return { error: error.message }
  }

  revalidatePath(`/dashboard/campaigns/${campaignId}`)
  return { success: true }
}
