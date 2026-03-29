'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateChannelTemplate(channelName: string, templateInstructions: string) {
  const supabase = await createClient()

  // Must be an admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (roleData && roleData.role === 'brand_user') {
    return { error: 'Unauthorized. You must be an admin to edit global templates.' }
  }

  // Update or insert template
  const { error } = await supabase
    .from('global_channel_templates')
    .upsert(
      { channel_name: channelName, template_instructions: templateInstructions },
      { onConflict: 'channel_name' }
    )

  if (error) {
    console.error('Failed to update template', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/settings/templates')
  return { success: true }
}
