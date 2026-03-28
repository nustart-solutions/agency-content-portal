import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CreateBrandModal from './CreateBrandModal'

export default async function OrganizationDetailsPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id: organizationId } = await params
  
  const supabase = await createClient()

  // Verify the user has access. RLS will naturally return 0 rows if they don't, 
  // giving us an elegant way to block access or show a 404 without complex logic!
  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', organizationId)
    .single()

  if (orgError || !organization) {
    redirect('/dashboard/organizations')
  }

  // Fetch the assigned Brands for this Organization
  const { data: brands } = await supabase
    .from('brands')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  return (
    <div className="section-container">
      <div className="section-header">
        <div className="breadcrumb">
          <Link href="/dashboard/organizations" className="back-link">
            &larr; Back to Organizations
          </Link>
          <h1 className="page-title">{organization.name}</h1>
        </div>
        <CreateBrandModal organizationId={organizationId} />
      </div>
      
      <p className="section-description">
        Manage the sub-brands and divisions belonging to this organization.
      </p>

      {(!brands || brands.length === 0) ? (
        <div className="empty-state glass-panel">
          <h3>No Brands Found</h3>
          <p>Get started by adding your first brand to {organization.name}.</p>
        </div>
      ) : (
        <div className="grid-list">
          {brands.map((brand: any) => (
            <Link key={brand.id} href={`/dashboard/brands/${brand.id}`} className="grid-card glass-panel">
              <div className="card-content">
                <div className="card-icon" style={{ 
                  backgroundImage: brand.logo_url ? `url(${brand.logo_url})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundColor: brand.logo_url ? 'transparent' : 'var(--glass-bg)'
                }}>
                  {!brand.logo_url && '🏢'}
                </div>
                <div>
                  <h3 className="card-title">{brand.name}</h3>
                  <p className="card-meta">
                    Created {new Date(brand.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
