'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getBrandTaxonomy, getBrandIdFromCampaign } from './sidebarActions'
import CreateSubgroupModal from '../brands/[id]/CreateSubgroupModal'
import CreateCampaignModal from '../brands/[id]/CreateCampaignModal'

type AssetCount = { id: string }
type Campaign = { id: string, name: string, status: string, assets: AssetCount[] }
type Subgroup = { id: string, name: string, campaigns: Campaign[] }
type Group = { id: string, name: string, campaign_subgroups: Subgroup[] }

export default function SidebarNav({ 
  userRole, 
  userBrandId 
}: { 
  userRole: string | null, 
  userBrandId: string | null 
}) {
  const pathname = usePathname()
  
  const [activeBrandId, setActiveBrandId] = useState<string | null>(userBrandId)
  const [taxonomy, setTaxonomy] = useState<Group[]>([])
  const [isLoadingTree, setIsLoadingTree] = useState(false)
  const [taxonomyError, setTaxonomyError] = useState<string | null>(null)

  // Accordion State
  const [openGroupId, setOpenGroupId] = useState<string | null>(null)
  const [openSubgroupId, setOpenSubgroupId] = useState<string | null>(null)

  // 1. Determine which Brand Tree should be shown based on the URL
  useEffect(() => {
    let isMounted = true

    const determineBrandAndFetch = async () => {
      let targetBrandId: string | null = null

      if (userRole === 'brand_user' && userBrandId) {
        targetBrandId = userBrandId
      } else if (pathname?.startsWith('/dashboard/brands/')) {
        const parts = pathname.split('/')
        if (parts.length >= 4) {
          targetBrandId = parts[3]
        }
      } else if (pathname?.startsWith('/dashboard/campaigns/')) {
        const parts = pathname.split('/')
        if (parts.length >= 4) {
          const cid = parts[3]
          const resolvedBrandId = await getBrandIdFromCampaign(cid)
          targetBrandId = resolvedBrandId
        }
      }

      if (targetBrandId && isMounted) {
        setActiveBrandId(targetBrandId)
        setIsLoadingTree(true)
        try {
          const treeData = await getBrandTaxonomy(targetBrandId)
          if (isMounted) {
            setTaxonomy(treeData || [])
            setIsLoadingTree(false)
          }
        } catch (err: any) {
          if (isMounted) {
            setTaxonomyError(err.message)
            setTaxonomy([])
            setIsLoadingTree(false)
          }
        }
      } else if (!targetBrandId && isMounted) {
        setActiveBrandId(null)
        setTaxonomy([])
      }
    }

    determineBrandAndFetch()
    
    return () => { isMounted = false }
  }, [pathname, userRole, userBrandId])


  const handleGroupClick = (groupId: string) => {
    setOpenGroupId(prev => prev === groupId ? null : groupId)
    // Optionally close subgroups when switching groups
    if (openGroupId !== groupId) {
      setOpenSubgroupId(null)
    }
  }

  const handleSubgroupClick = (subgroupId: string) => {
    setOpenSubgroupId(prev => prev === subgroupId ? null : subgroupId)
  }

  return (
    <nav className="sidebar-nav hide-scrollbar" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
      
      {/* ----------------------------- */}
      {/* DYNAMIC CAMPAIGN TREE          */}
      {/* ----------------------------- */}
      {activeBrandId && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ marginBottom: '0.75rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.05em', padding: '0 1rem', fontWeight: 600 }}>
            Active Groups
          </div>
          
          {isLoadingTree ? (
            <div style={{ padding: '0 1rem', fontSize: '0.85rem', color: 'var(--muted)', opacity: 0.7 }}>Loading tree...</div>
          ) : taxonomy.length === 0 ? (
            <div style={{ padding: '0 1rem', fontSize: '0.85rem', color: 'var(--muted)', opacity: 0.7 }}>
              <div style={{ marginBottom: '0.5rem' }}>No campaigns found.</div>
              {/* Debug UI block */}
              <div style={{ fontSize: '0.65rem', wordBreak: 'break-all', color: 'red' }}>
                ID checked: {activeBrandId}<br/>
                {taxonomyError ? `Error: ${taxonomyError}` : 'Status: Query completed, but no records exist.'}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {taxonomy.map(group => {
                const isGroupOpen = openGroupId === group.id
                // Calculate total assets for the Group
                const groupAssetCount = group.campaign_subgroups?.reduce((subAcc, sub) => {
                  return subAcc + (sub.campaigns?.reduce((campAcc, camp) => campAcc + (camp.assets?.length || 0), 0) || 0)
                }, 0) || 0
                
                return (
                  <div key={group.id} className="sidebar-tree-node">
                    {/* Group Header */}
                    <div style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '0.25rem 0.5rem', 
                        background: isGroupOpen ? 'rgba(var(--primary-rgb), 0.05)' : 'transparent',
                        borderRadius: '6px',
                        transition: 'all 0.2s'
                      }}>
                      <button 
                        onClick={() => handleGroupClick(group.id)}
                        style={{
                          display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'space-between',
                          background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
                          color: isGroupOpen ? 'var(--primary)' : 'var(--foreground)',
                          fontWeight: isGroupOpen ? 600 : 500,
                          fontSize: '0.9rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                          <span style={{ marginRight: '0.5rem', transform: isGroupOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'inline-block', fontSize: '0.7rem' }}>▶</span>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{group.name}</span>
                        </div>
                        {groupAssetCount > 0 && !isGroupOpen && (
                           <span style={{ background: 'var(--border)', color: 'var(--muted)', padding: '1px 6px', borderRadius: '10px', fontSize: '0.65rem', marginLeft: '8px' }}>
                             {groupAssetCount}
                           </span>
                        )}
                      </button>
                    </div>

                    {/* Group Children (Subgroups) */}
                    {isGroupOpen && group.campaign_subgroups && group.campaign_subgroups.length > 0 && (
                      <div style={{ paddingLeft: '1.25rem', marginTop: '2px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {group.campaign_subgroups.map(subgroup => {
                          const isSubgroupOpen = openSubgroupId === subgroup.id
                          // Calculate total assets for the Subgroup
                          const subgroupAssetCount = subgroup.campaigns?.reduce((acc, camp) => acc + (camp.assets?.length || 0), 0) || 0
                          
                          return (
                            <div key={subgroup.id}>
                              <div style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '0.25rem 0.25rem' }}>
                                <button
                                  onClick={() => handleSubgroupClick(subgroup.id)}
                                  style={{
                                    display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'space-between',
                                    background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
                                    color: 'var(--foreground)', opacity: isSubgroupOpen ? 1 : 0.8,
                                    fontWeight: isSubgroupOpen ? 500 : 400,
                                    fontSize: '0.85rem'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                                    <span style={{ marginRight: '0.4rem', transform: isSubgroupOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'inline-block', fontSize: '0.6rem' }}>▶</span>
                                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{subgroup.name}</span>
                                  </div>
                                  {subgroupAssetCount > 0 && !isSubgroupOpen && (
                                     <span style={{ background: 'var(--border)', color: 'var(--muted)', padding: '1px 6px', borderRadius: '10px', fontSize: '0.65rem', marginLeft: '6px' }}>
                                       {subgroupAssetCount}
                                     </span>
                                  )}
                                </button>
                              </div>

                              {/* Subgroup Children (Campaigns) */}
                              {isSubgroupOpen && subgroup.campaigns && subgroup.campaigns.length > 0 && (
                                <div style={{ paddingLeft: '1rem', marginTop: '2px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  {subgroup.campaigns.map(campaign => {
                                    const isActiveCampaign = pathname === `/dashboard/campaigns/${campaign.id}`
                                    const assetCount = campaign.assets?.length || 0

                                    return (
                                      <Link 
                                        key={campaign.id}
                                        href={`/dashboard/campaigns/${campaign.id}`}
                                        style={{
                                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                          padding: '0.4rem 0.5rem 0.4rem 1.2rem',
                                          textDecoration: 'none',
                                          color: isActiveCampaign ? 'var(--primary)' : 'var(--muted)',
                                          background: isActiveCampaign ? 'rgba(var(--primary-rgb), 0.05)' : 'transparent',
                                          fontSize: '0.8rem',
                                          borderRadius: '4px',
                                          borderLeft: isActiveCampaign ? '2px solid var(--primary)' : '2px solid transparent'
                                        }}
                                      >
                                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                           • {campaign.name}
                                        </span>
                                        <span style={{ background: 'var(--border)', padding: '1px 6px', borderRadius: '10px', fontSize: '0.7rem', opacity: 0.7 }}>
                                          {assetCount}
                                        </span>
                                      </Link>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ----------------------------- */}
      {/* GLOBAL UTILITIES               */}
      {/* ----------------------------- */}
      <div style={{ marginTop: 'auto', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        
        {userRole !== 'brand_user' ? (
          <>
            <div style={{ marginBottom: '0.25rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.05em', padding: '0 1rem', fontWeight: 600 }}>Agency Views</div>
            <Link href="/dashboard" className="nav-link">Overview</Link>
            <Link href="/dashboard/organizations" className="nav-link">Organizations</Link>
            {activeBrandId && <Link href={`/dashboard/brands/${activeBrandId}`} className="nav-link">Active Brand Dashboard</Link>}
            <Link href="/dashboard/reports" className="nav-link">📊 Tracking & Reports</Link>
            {activeBrandId && <Link href={`/dashboard/brands/${activeBrandId}/calendar`} className="nav-link">📅 Brand Calendar</Link>}
          </>
        ) : (
          <>
            {userBrandId && <Link href={`/dashboard/brands/${userBrandId}`} className="nav-link">My Brand Dashboard</Link>}
          </>
        )}
        
        {/* Placed at the very bottom as requested */}
        {userRole !== 'brand_user' && (
          <Link href="/dashboard/settings/templates" className="nav-link" style={{ marginTop: '0.5rem' }}>⚙️ Global Templates</Link>
        )}
      </div>

    </nav>
  )
}
