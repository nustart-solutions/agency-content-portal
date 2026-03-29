import Scoreboard from '@/components/Scoreboard'

export default function ReportsPage() {
  return (
    <div className="section-container">
      <div className="section-header">
        <h1 className="page-title">Tracking & Reports</h1>
      </div>
      <p className="section-description" style={{ marginBottom: '2.5rem' }}>
        Global agency scoreboard measuring asset pipeline efficiency and performance.
      </p>

      <Scoreboard />
      
      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', marginTop: '3rem', color: 'var(--muted)' }}>
        More granular reporting graphs coming soon.
      </div>
    </div>
  )
}
