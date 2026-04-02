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

export async function addBrandContext(brandId: string, formData: FormData) {
  const supabase = await createClient()
  const contextType = formData.get('context_type') as string
  const contentMarkdown = formData.get('content_markdown') as string

  if (!contextType || !contentMarkdown || contentMarkdown.trim() === '') {
    return { error: 'Context type and content are required' }
  }

  // Upsert seamlessly overwrites if this type of context already exists!
  const { error } = await supabase
    .from('brand_contexts')
    .upsert(
      { brand_id: brandId, context_type: contextType, content_markdown: contentMarkdown.trim() },
      { onConflict: 'brand_id,context_type' }
    )

  if (error) {
    console.error('Context Insertion Error:', error.message)
    return { error: error.message }
  }

  revalidatePath(`/dashboard/brands/${brandId}`)
  return { success: true }
}

export async function updateBrand(brandId: string, formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string
  const logoUrl = formData.get('logo_url') as string
  const websiteUrl = formData.get('website_url') as string
  const requiresApproval = formData.get('requires_approval') === 'on'

  if (!name || name.trim() === '') {
    return { error: 'Brand name is required' }
  }

  const { error } = await supabase
    .from('brands')
    .update({
      name: name.trim(),
      logo_url: logoUrl ? logoUrl.trim() : null,
      website_url: websiteUrl ? websiteUrl.trim() : null,
      requires_approval: requiresApproval
    })
    .eq('id', brandId)

  if (error) {
    console.error('Brand Update Error:', error.message)
    return { error: error.message }
  }

  revalidatePath(`/dashboard/brands/${brandId}`)
  return { success: true }
}

export async function triggerGenerateBrandContext(brandId: string, websiteUrl: string) {
  const supabase = await createClient()

  // Step 1: Optimistically update UI to generating
  const { error } = await supabase
    .from('brands')
    .update({ context_status: 'generating' })
    .eq('id', brandId)

  if (error) {
    console.error('Error starting context generation:', error)
    return { error: error.message }
  }

  // Step 2: Trigger Modal Webhook asynchronously (Fire and forget)
  const modalUrl = process.env.MODAL_GENERATE_BRAND_CONTEXT_URL || 'https://content-portal-execution-generate-brand-context.modal.run'
  try {
    fetch(modalUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand_id: brandId, website_url: websiteUrl })
    }).catch(e => console.error("Modal fetch failed (async):", e))
  } catch (err) {
    console.error("Modal fetch setup failed:", err)
  }

  revalidatePath(`/dashboard/brands/${brandId}`)
  return { success: true }
}

export async function updateBrandCredentials(brandId: string, formData: FormData) {
  const supabase = await createClient()
  const wp_url = formData.get('wp_url') as string
  const wp_username = formData.get('wp_username') as string
  const wp_password = formData.get('wp_password') as string

  const credentials: any = {}
  
  if (wp_url || wp_username || wp_password) {
    credentials.wordpress = {
      url: wp_url?.trim() || '',
      username: wp_username?.trim() || '',
      password: wp_password?.trim() || '',
      auth_type: 'application_password'
    }
  }

  const { error } = await supabase.rpc('set_brand_credentials', {
    p_brand_id: brandId,
    p_credentials_json: JSON.stringify(credentials)
  })

  if (error) {
    console.error('Credential Update Error:', error.message)
    return { error: error.message }
  }

  revalidatePath(`/dashboard/brands/${brandId}`)
  return { success: true }
}

export async function deleteCampaignGroup(brandId: string, groupId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('campaign_groups')
    .delete()
    .eq('id', groupId)

  if (error) {
    console.error('Group Deletion Error:', error.message)
    return { error: error.message }
  }

  revalidatePath(`/dashboard/brands/${brandId}`)
  return { success: true }
}

export async function deleteCampaignSubgroup(brandId: string, subgroupId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('campaign_subgroups')
    .delete()
    .eq('id', subgroupId)

  if (error) {
    console.error('Subgroup Deletion Error:', error.message)
    return { error: error.message }
  }

  revalidatePath(`/dashboard/brands/${brandId}`)
  return { success: true }
}
