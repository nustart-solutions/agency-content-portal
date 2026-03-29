import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import TemplateEditor from './TemplateEditor'

export const metadata = {
  title: 'Global Channel Templates | Agency Portal',
}

export default async function GlobalTemplatesPage() {
  const supabase = await createClient()

  // Ensure user is not just a brand user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (roleData && roleData.role === 'brand_user') {
    redirect('/dashboard') // unauthorized
  }

  // Fetch all global channel templates
  const { data: templates } = await supabase
    .from('global_channel_templates')
    .select('*')
    .order('channel_name')

  return (
    <div className="dashboard-content" style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>Global Channel Templates</h1>
        <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.9rem' }}>
          Define the strict prompt constraints required for every social media algorithm. These platform rules are injected into AI requests across <strong>all</strong> connected brands.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '1.5rem' }}>
        {templates?.map((template) => (
          <div key={template.channel_name} className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem', textTransform: 'capitalize' }}>
              {template.channel_name.replace('_', ' ')}
            </h3>
            
            <TemplateEditor 
              channelName={template.channel_name} 
              initialInstructions={template.template_instructions} 
            />
          </div>
        ))}

        {!templates || templates.length === 0 && (
          <div className="glass-panel p-6 text-center text-muted">
            No templates found. Have you ran the `11_global_channel_templates.sql` migration in Supabase yet?
          </div>
        )}
      </div>
    </div>
  )
}
