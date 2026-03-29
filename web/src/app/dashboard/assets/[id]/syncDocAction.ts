'use server'

import { revalidatePath } from 'next/cache'

export async function syncDocAction(assetId: string) {
  const modalUrl = process.env.MODAL_SYNC_ASSET_URL
  if (!modalUrl) {
    return { error: 'Modal Sync Webhook URL is not configured in Vercel. Please set MODAL_SYNC_ASSET_URL.' }
  }

  try {
    const res = await fetch(modalUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ asset_id: assetId })
    })

    const data = await res.json()

    if (!res.ok || data.error) {
      return { error: data.error || 'Failed to sync from Modal.' }
    }

    revalidatePath(`/dashboard/assets/${assetId}`)
    return { success: true }
  } catch (error: any) {
    return { error: `Network error reaching Modal: ${error.message}` }
  }
}
