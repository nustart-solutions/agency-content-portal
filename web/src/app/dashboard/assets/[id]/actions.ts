'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { publishToWordPress } from './publishAction'

export async function saveAssetDetails(assetId: string, formData: FormData) {
  const supabase = await createClient()

  const meta_title = formData.get('meta_title') as string
  const meta_description = formData.get('meta_description') as string
  const focus_keyword = formData.get('focus_keyword') as string
  const status = formData.get('status') as string
  const content_markdown = formData.get('content_markdown') as string

  const payload: any = {
    meta_title,
    meta_description,
    focus_keyword,
    status,
    content_markdown
  }

  const { error } = await supabase
    .from('assets')
    .update(payload)
    .eq('id', assetId)

  if (error) {
    return { error: error.message }
  }

  let publishResult: any = null
  if (status === 'staged') {
    publishResult = await publishToWordPress(assetId)
  }

  revalidatePath(`/dashboard/assets/${assetId}`)

  if (publishResult && publishResult.error) {
    return { error: `Asset saved and staged, but WP publishing failed: ${publishResult.error}` }
  } else if (publishResult?.success) {
    return { success: true, message: `Saved and published to WordPress successfully!\nLink: ${publishResult.link}` }
  }

  return { success: true, message: 'Asset updated successfully.' }
}
