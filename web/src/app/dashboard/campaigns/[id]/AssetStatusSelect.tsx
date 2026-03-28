'use client'

import { useTransition } from 'react'
import { updateAssetStatus } from './actions'

const STATUSES = [
  'draft', 'ready', 'in_progress', 'review', 'approved', 
  'staged', 'scheduled', 'published', 'completed', 'cancelled'
]

export default function AssetStatusSelect({ 
  assetId, 
  campaignId, 
  currentStatus 
}: { 
  assetId: string, 
  campaignId: string, 
  currentStatus: string 
}) {
  const [isPending, startTransition] = useTransition()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value
    startTransition(async () => {
      await updateAssetStatus(assetId, campaignId, newStatus)
    })
  }

  // Define some colors based on status
  const getStatusColor = (status: string) => {
    if (status === 'published' || status === 'completed' || status === 'approved') return '#10b981' // green
    if (status === 'review' || status === 'ready' || status === 'scheduled') return '#f59e0b' // yellow
    if (status === 'draft' || status === 'cancelled') return '#6b7280' // gray
    return '#3b82f6' // blue default
  }

  return (
    <select
      value={currentStatus}
      onChange={handleChange}
      disabled={isPending}
      style={{
        padding: '0.25rem 0.5rem',
        borderRadius: '4px',
        border: `1px solid ${getStatusColor(currentStatus)}`,
        background: 'rgba(0,0,0,0.1)',
        color: getStatusColor(currentStatus),
        fontSize: '0.8rem',
        cursor: isPending ? 'wait' : 'pointer',
        fontWeight: 600
      }}
    >
      {STATUSES.map(s => (
        <option key={s} value={s} style={{ color: 'initial' }}>{s.replace('_', ' ').toUpperCase()}</option>
      ))}
    </select>
  )
}
