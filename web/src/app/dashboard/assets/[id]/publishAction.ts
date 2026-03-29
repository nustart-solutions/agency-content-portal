'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { convertMarkdownToGutenberg } from '@/utils/markdownToGutenberg'

export async function publishToWordPress(assetId: string) {
  const supabase = await createClient()

  // 1. Fetch Asset Data and resolve its Brand
  const { data: asset, error: assetError } = await supabase
    .from('assets')
    .select(`
      *,
      campaigns (
        id,
        campaign_subgroups (
          id,
          campaign_groups (
            id,
            brand_id,
            brands (
              id,
              website_url
            )
          )
        )
      )
    `)
    .eq('id', assetId)
    .single()

  if (assetError || !asset) {
    return { error: 'Failed to fetch asset or you do not have permission' }
  }

  const brandId = asset.campaigns?.campaign_subgroups?.campaign_groups?.brand_id
  const websiteUrl = asset.campaigns?.campaign_subgroups?.campaign_groups?.brands?.website_url
  
  if (!brandId) {
    return { error: 'Could not resolve brand for this asset' }
  }

  // 2. Fetch Vault Credentials securely via service_role RPC
  const { data: credentialsData, error: credError } = await supabase
    .rpc('get_brand_credentials', { p_brand_id: brandId })

  if (credError || !credentialsData) {
    return { error: 'WordPress credentials not configured for this brand' }
  }

  // Expecting a JSON string from Vault
  let credentials;
  try {
    credentials = JSON.parse(credentialsData)
  } catch (e) {
    return { error: 'Invalid credentials format in vault' }
  }

  const wp_url = credentials?.wordpress?.url
  const wp_username = credentials?.wordpress?.username
  const wp_password = credentials?.wordpress?.password

  if (!wp_url || !wp_username || !wp_password) {
    return { error: 'Incomplete WordPress credentials configured' }
  }

  // 3. Compile Content into Gutenberg Blocks
  const blockContent = convertMarkdownToGutenberg(asset.content_markdown || '')

  // 4. Construct Payload
  const wpPayload = {
    title: asset.meta_title || asset.title,
    content: blockContent,
    status: 'draft', // Draft status allows clients to review before making it live
    meta: {
      // Yoast SEO Support
      _yoast_wpseo_title: asset.meta_title || asset.title,
      _yoast_wpseo_metadesc: asset.meta_description || '',
      _yoast_wpseo_focuskw: asset.focus_keyword || '',
      
      // Rank Math SEO Support
      rank_math_title: asset.meta_title || asset.title,
      rank_math_description: asset.meta_description || '',
      rank_math_focus_keyword: asset.focus_keyword || ''
    }
  }

  // 5. Fire HTTP Request via standard fetch
  // Use a standard browser UA to prevent blocking by Cloudflare WAF
  const authHeader = 'Basic ' + Buffer.from(wp_username + ':' + wp_password).toString('base64')

  try {
    const response = await fetch(`${wp_url}/wp/v2/${asset.asset_type === 'page' ? 'pages' : 'posts'}`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      body: JSON.stringify(wpPayload)
    })

    const responseData = await response.json()

    if (!response.ok) {
      console.error('WP API Error:', responseData)
      return { error: `WordPress Error: ${responseData.message || response.statusText}` }
    }


    // 6. Update Asset in DB
    const { error: updateError } = await supabase
      .from('assets')
      .update({
        wordpress_post_id: String(responseData.id),
        wordpress_post_url: responseData.link,
      })
      .eq('id', assetId)

    if (updateError) {
      return { error: 'Successfully posted to WordPress, but failed to save the link in our database' }
    }

    // Revalidate UI
    revalidatePath(`/dashboard/assets/${assetId}`)
    return { success: true, link: responseData.link }

  } catch (err: any) {
    return { error: `Failed to connect or post to WordPress API: ${err.message}` }
  }
}
