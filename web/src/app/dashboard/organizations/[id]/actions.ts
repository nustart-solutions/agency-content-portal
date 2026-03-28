'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export const createBrand = async (organizationId: string, formData: FormData) => {
  const name = formData.get('name') as string
  const logoUrl = formData.get('logo_url') as string
  const supabase = await createClient()

  const { error: brandError } = await supabase
    .from('brands')
    .insert([{ organization_id: organizationId, name, logo_url: logoUrl || null }])

  if (brandError) {
    return { error: `Database Error: ${brandError.message} (Code: ${brandError.code})` }
  }

  // Force the layout to instantly fetch the fresh database results without refreshing the browser!
  revalidatePath(`/dashboard/organizations/${organizationId}`)
  return { success: true }
}
