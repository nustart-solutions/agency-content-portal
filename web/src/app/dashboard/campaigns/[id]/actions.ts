'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createAsset(campaignId: string, formData: FormData) {
  const supabase = await createClient()
  
  const title = formData.get('title') as string
  const asset_type = formData.get('asset_type') as string
  const channel = formData.get('channel') as string
  const is_anchor = formData.get('is_anchor') === 'on'
  const deep_research = formData.get('deep_research') === 'on'

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
      deep_research,
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

  // Prepare standard update payload
  const updatePayload: any = { status: newStatus }

  // If status transitions to approved, stamp the approval time
  if (newStatus === 'approved') {
    updatePayload.approved_at = new Date().toISOString()
  }
  
  // If status transitions to published via the dropdown (fallback), stamp publish time
  if (newStatus === 'published') {
    updatePayload.published_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('assets')
    .update(updatePayload)
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

  // Find the brand to check approval settings and extract names for Google Drive folder taxonomy
  const { data: assetData } = await supabase
    .from('assets')
    .select('*, campaigns(name, campaign_subgroups(campaign_groups(brand_id, brands(name, requires_approval))))')
    .eq('id', assetId)
    .single()

  const requiresApproval = assetData?.campaigns?.campaign_subgroups?.campaign_groups?.brands?.requires_approval ?? true
  const brandName = assetData?.campaigns?.campaign_subgroups?.campaign_groups?.brands?.name || 'Unknown Brand'
  const campaignName = assetData?.campaigns?.name || 'Unknown Campaign'

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
  const modalUrl = process.env.MODAL_GENERATE_ASSET_URL || 'https://example.modal.run'
  try {
    fetch(modalUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        asset_id: assetId,
        requires_approval: requiresApproval,
        title: assetData?.title,
        asset_type: assetData?.asset_type,
        deep_research: assetData?.deep_research || false,
        brand_name: brandName,
        campaign_name: campaignName
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
  const modalUrl = process.env.MODAL_INGEST_ASSET_URL || 'https://example.modal.run'
  try {
    fetch(modalUrl, {
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

  // First, optimize the UI by updating status to "published" and record the exact timestamp
  const { error } = await supabase
    .from('assets')
    .update({ 
      status: 'published',
      published_at: new Date().toISOString()
    })
    .eq('id', assetId)

  if (error) {
    console.error('Error publishing asset:', error)
    return { error: error.message }
  }

  // Trigger Modal Webhook asynchronously (Fire and forget) to actually publish
  const modalUrl = process.env.MODAL_PUBLISH_ASSET_URL || 'https://example.modal.run'
  try {
    fetch(modalUrl, {
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

export async function resetAssetToDraft(assetId: string, campaignId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('assets')
    .update({ status: 'draft' })
    .eq('id', assetId)

  if (error) {
    console.error('Error resetting asset:', error)
    return { error: error.message }
  }

  revalidatePath(`/dashboard/campaigns/${campaignId}`)
  return { success: true }
}

export async function deleteAsset(assetId: string, campaignId: string) {
  const supabase = await createClient()

  // First delete the asset
  const { error } = await supabase
    .from('assets')
    .delete()
    .eq('id', assetId)

  if (error) {
    console.error('Error deleting asset:', error)
    return { error: error.message }
  }

  revalidatePath(`/dashboard/campaigns/${campaignId}`)
  return { success: true }
}

export async function deleteCampaign(campaignId: string, brandId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', campaignId)

  if (error) {
    console.error('Error deleting campaign:', error)
    return { error: error.message }
  }

  // Next.js redirect gracefully interrupts Server Action flow and forces 302 navigation client-side
  redirect(`/dashboard/brands/${brandId}`)
}

export async function bulkCreateSpokeAssets(campaignId: string, anchorId: string, channels: string[], publishedUrl: string) {
  const supabase = await createClient()

  // Find the anchor to copy its title as a base, and to check approval requirements
  const { data: anchorData, error: anchorError } = await supabase
    .from('assets')
    .select('title, campaigns(name, campaign_subgroups(campaign_groups(brand_id, brands(name, requires_approval))))')
    .eq('id', anchorId)
    .single()

  if (anchorError || !anchorData) {
    return { error: 'Anchor asset not found' }
  }

  // Update anchor's published URL
  await supabase
    .from('assets')
    .update({ published_url: publishedUrl })
    .eq('id', anchorId)

  const campaignsAny = anchorData.campaigns as any
  const requiresApproval = campaignsAny?.campaign_subgroups?.campaign_groups?.brands?.requires_approval ?? true
  const brandName = campaignsAny?.campaign_subgroups?.campaign_groups?.brands?.name || 'Unknown Brand'
  const campaignName = campaignsAny?.name || 'Unknown Campaign'
  const baseTitle = anchorData.title

  // Create each spoke
  for (const channel of channels) {
    let assetType = 'social_post'
    if (channel === 'gmb_post') assetType = 'gmb_post'
    if (channel === 'email_newsletter') assetType = 'email_newsletter'
    
    // 1. Insert into database
    const { data: newAsset, error: insertError } = await supabase
      .from('assets')
      .insert({
        campaign_id: campaignId,
        title: `${channel.replace('_', ' ').toUpperCase()} Spinoff - ${baseTitle}`,
        asset_type: assetType,
        channel: channel,
        is_anchor: false,
        anchor_asset_id: anchorId,
        status: 'in_progress', // immediately send to generator
        deep_research: false // Spokes use repurposing, not fresh research
      })
      .select('id')
      .single()

    if (insertError) {
      console.error(`Error inserting spoke for ${channel}:`, insertError)
      continue;
    }

    // 2. Trigger Webhook async
    const modalUrl = process.env.MODAL_GENERATE_ASSET_URL || 'https://example.modal.run'
    try {
      fetch(modalUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          asset_id: newAsset.id,
          requires_approval: requiresApproval,
          title: `${channel.replace('_', ' ').toUpperCase()} Spinoff - ${baseTitle}`,
          asset_type: assetType,
          deep_research: false,
          brand_name: brandName,
          campaign_name: campaignName
        })
      }).catch(e => console.error(`Modal fetch failed for ${channel}:`, e))
    } catch (err) {
      console.error(`Modal fetch setup failed for ${channel}:`, err)
    }
  }

  revalidatePath(`/dashboard/campaigns/${campaignId}`)
  return { success: true }
}
