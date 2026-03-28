'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function createOrganization(formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string

  if (!name) return { error: 'Name is required' }

  const { error: orgError } = await supabase
    .from('organizations')
    .insert([{ name }])

  if (orgError) {
    // If the user isn't physically an agency_admin in user_roles, RLS will throw a security violation here!
    return { error: 'Security Violation: You do not have Agency Admin privileges to insert Organizations. (RLS Blocked)' }
  }

  // Force the layout to instantly fetch the fresh database results without refreshing the browser!
  revalidatePath('/dashboard/organizations')
  return { success: true }
}
