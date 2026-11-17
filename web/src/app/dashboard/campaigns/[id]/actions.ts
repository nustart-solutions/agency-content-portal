'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { callModal } from '@/utils/modal'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

// Put an asset back to draft and record why, so the campaign page shows the reason.
async function markGenerationFailed(supabase: SupabaseServerClient, assetId: string, reason: string) {
  await supabase.from('assets').update({ status: 'draft' }).eq('id', assetId)
  await supabase.from('assets').update({ generation_error: reason }).eq('id', assetId)
}

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

export async function updateAssetTitle(assetId: string, campaignId: string, newTitle: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('assets')
    .update({ title: newTitle })
    .eq('id', assetId)

  if (error) {
    console.error('Error updating asset title:', error)
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

  // Step 2: Hand the job to Modal and wait for it to confirm it was accepted
  // (Modal replies in seconds; the generation itself runs in the background).
  const call = await callModal('MODAL_GENERATE_ASSET_URL', {
    asset_id: assetId,
    requires_approval: requiresApproval,
    title: assetData?.title,
    asset_type: assetData?.asset_type,
    deep_research: assetData?.deep_research || false,
    brand_name: brandName,
    campaign_name: campaignName
  })

  if (!call.ok) {
    console.error('Generate asset could not start:', call.error)
    await markGenerationFailed(supabase, assetId, call.error)
    revalidatePath(`/dashboard/campaigns/${campaignId}`)
    return { error: call.error }
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

  // Trigger Modal to scrape/QA the submitted URL (quick job, so we wait for it)
  const call = await callModal('MODAL_INGEST_ASSET_URL', { asset_id: assetId, url: externalUrl })

  revalidatePath(`/dashboard/campaigns/${campaignId}`)
  if (!call.ok) {
    console.error('Modal ingest failed:', call.error)
    return { error: `Saved for review, but importing the document failed: ${call.error}` }
  }
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

  // Trigger Modal to actually publish (quick job, so we wait for it)
  const call = await callModal('MODAL_PUBLISH_ASSET_URL', { asset_id: assetId })

  revalidatePath(`/dashboard/campaigns/${campaignId}`)
  if (!call.ok) {
    console.error('Modal publish failed:', call.error)
    return { error: `Marked as published, but the publish step failed: ${call.error}` }
  }
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
  const failedChannels: string[] = []
  for (const channel of channels) {
    let assetType = 'social_post'
    if (channel === 'gmb_post') assetType = 'gmb_post'
    if (channel === 'email_newsletter') assetType = 'email_newsletter'
    
    // 1. Insert into database
    const { data: newAsset, error: insertError } = await supabase
      .from('assets')
      .insert({
        campaign_id: campaignId,
        title: `${channel.replace('_', ' ').toUpperCase()} - ${baseTitle}`,
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

    // 2. Hand the job to Modal and wait for it to confirm it was accepted
    const call = await callModal('MODAL_GENERATE_ASSET_URL', {
      asset_id: newAsset.id,
      requires_approval: requiresApproval,
      title: `${channel.replace('_', ' ').toUpperCase()} - ${baseTitle}`,
      asset_type: assetType,
      deep_research: false,
      brand_name: brandName,
      campaign_name: campaignName
    })
    if (!call.ok) {
      console.error(`Generate spoke could not start for ${channel}:`, call.error)
      await markGenerationFailed(supabase, newAsset.id, call.error)
      failedChannels.push(channel)
    }
  }

  revalidatePath(`/dashboard/campaigns/${campaignId}`)
  if (failedChannels.length > 0) {
    return { error: `Could not start generation for: ${failedChannels.join(', ')}. Those spokes were left as drafts; see the error on each.` }
  }
  return { success: true }
}

export async function bulkImportPublishedAnchors(campaignId: string, formData: FormData) {
  const supabase = await createClient()

  const rawText = formData.get('raw_text') as string
  const assetType = formData.get('asset_type') as string
  const channel = formData.get('channel') as string

  if (!rawText || !assetType || !channel) {
    return { error: 'Missing required configuration.' }
  }

  // Parse lines. Exclude empty ones.
  const lines = rawText.split('\n').filter(line => line.trim() !== '')
  
  const inserts = []

  for (const line of lines) {
    // Attempt to split by tab (Excel/Sheets defaults to tab separation)
    const columns = line.split('\t').map(c => c.trim())
    
    // We expect at least a Title
    const title = columns[0]
    if (!title) continue
    
    // URL might be column 2
    const publishedUrl = columns[1] || null
    
    // Date might be column 3. Default to now if invalid or missing.
    let publishedAt = new Date().toISOString()
    if (columns[2]) {
      const parsedDate = new Date(columns[2])
      if (!isNaN(parsedDate.getTime())) {
        publishedAt = parsedDate.toISOString()
      }
    }

    inserts.push({
      campaign_id: campaignId,
      title: title,
      asset_type: assetType,
      channel: channel,
      status: 'published',
      is_anchor: true,
      published_url: publishedUrl,
      published_at: publishedAt,
      // Since it's imported as published, we immediately mark it approved too so metrics match logic implicitly
      approved_at: publishedAt
    })
  }

  if (inserts.length === 0) {
    return { error: 'No valid rows parsed. Make sure you pasted data.' }
  }

  const { error } = await supabase
    .from('assets')
    .insert(inserts)

  if (error) {
    console.error('Error importing assets:', error)
    return { error: error.message }
  }

  revalidatePath(`/dashboard/campaigns/${campaignId}`)
  return { success: true }
}

export async function getAssetNotifications(assetId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('asset_notifications')
    .select('*')
    .eq('asset_id', assetId)
    .order('notified_at', { ascending: false })

  if (error) {
    console.error('Error fetching notifications:', error)
    return { error: error.message, data: null }
  }

  return { success: true, data }
}

export async function addAssetNotification(assetId: string, campaignId: string, formData: FormData) {
  const supabase = await createClient()
  
  const recipient_email = formData.get('recipient_email') as string
  const message = formData.get('message') as string

  if (!recipient_email) {
    return { error: 'Recipient email is required' }
  }

  // Get current user's email to use as sender
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { error: 'Not authenticated' }
  }
  const sender_email = user.email || 'unknown@user.com'

  const { error } = await supabase
    .from('asset_notifications')
    .insert({
      asset_id: assetId,
      sender_email,
      recipient_email,
      message,
    })

  if (error) {
    console.error('Error adding notification:', error)
    return { error: error.message }
  }

  // Future integration: Actually send an email via Resend API here if needed.
  
  revalidatePath(`/dashboard/campaigns/${campaignId}`)
  return { success: true }
}
