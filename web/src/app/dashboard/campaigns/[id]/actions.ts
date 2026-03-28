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

export async function triggerGenerateAsset(assetId: string, campaignId: string) {
  const supabase = await createClient()

  // Find the brand to check approval settings (stub for Modal payload later)
  const { data: assetData } = await supabase
    .from('assets')
    .select('*, campaigns(campaign_subgroups(campaign_groups(brand_id, brands(requires_approval))))')
    .eq('id', assetId)
    .single()

  const requiresApproval = assetData?.campaigns?.campaign_subgroups?.campaign_groups?.brands?.requires_approval ?? true

  // Step 1: Optimistically update UI to in_progress
  const { error } = await supabase
    .from('assets')
    .update({ status: 'in_progress' })
    .eq('id', assetId)

  if (error) {
    console.error('Error starting generation:', error)
    return { error: error.message }
  }

  // Step 2: Trigger Modal Webhook asynchronously (Fire and forget)
  // In production, this fetch would hit your Modal Layer 3 endpoint.
  const modalUrl = process.env.MODAL_WEBHOOK_URL || 'https://example.modal.run'
  try {
    fetch(`${modalUrl}/generate_asset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        asset_id: assetId,
        requires_approval: requiresApproval,
        title: assetData?.title,
        asset_type: assetData?.asset_type
      })
    }).catch(e => console.error("Modal fetch failed (async):", e))
  } catch (err) {
    console.error("Modal fetch setup failed:", err)
  }

  revalidatePath(`/dashboard/campaigns/${campaignId}`)
  return { success: true }
}

export async function submitExternalAsset(assetId: string, campaignId: string, formData: FormData) {
  const supabase = await createClient()
  const externalUrl = formData.get('url') as string

  if (!externalUrl) {
    return { error: 'Please provide a valid URL.' }
  }

  // A client has submitted a manual document. Mark as 'review' directly.
  const { error } = await supabase
    .from('assets')
    .update({ 
      status: 'review',
      // We would ideally store this URL in a new database column (e.g. external_source_url)
      // For now, we just update status to trigger the review stage.
    })
    .eq('id', assetId)

  if (error) {
    console.error('Error submitting external asset:', error)
    return { error: error.message }
  }

  // Optional: Trigger Modal to scrape/QA the submitted URL
  const modalUrl = process.env.MODAL_WEBHOOK_URL || 'https://example.modal.run'
  try {
    fetch(`${modalUrl}/ingest_client_asset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ asset_id: assetId, url: externalUrl })
    }).catch(e => console.error("Modal ingest failed (async):", e))
  } catch (err) { }

  revalidatePath(`/dashboard/campaigns/${campaignId}`)
  return { success: true }
}

export async function triggerPublishAsset(assetId: string, campaignId: string) {
  const supabase = await createClient()

  // First, optimize the UI by updating status to "approved" and maybe soon-to-be "published"
  const { error } = await supabase
    .from('assets')
    .update({ status: 'approved' })
    .eq('id', assetId)

  if (error) {
    console.error('Error approving asset:', error)
    return { error: error.message }
  }

  // Trigger Modal Webhook asynchronously (Fire and forget) to actually publish
  const modalUrl = process.env.MODAL_WEBHOOK_URL || 'https://example.modal.run'
  try {
    fetch(`${modalUrl}/publish_asset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ asset_id: assetId })
    }).catch(e => console.error("Modal publish failed (async):", e))
  } catch (err) {
    console.error("Modal publish setup failed:", err)
  }

  revalidatePath(`/dashboard/campaigns/${campaignId}`)
  return { success: true }
}
