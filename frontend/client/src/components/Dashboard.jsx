import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import NavBar from './NavBar'
import Footer from './Footer'

export default function Dashboard() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading]   = useState(true)
  const navigate = useNavigate()
  const chartRef = useRef(null)
  const chartInstance = useRef(null)

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        const { data } = await supabase
          .from('sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20)
        setSessions(data || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])
  
  useEffect(() => {
    if (!chartRef.current || sessions.length === 0) return

    const loadChart = async () => {
      const { Chart, registerables } = await import('chart.js')
      Chart.register(...registerables)

      if (chartInstance.current) chartInstance.current.destroy()

      const labels = [...sessions].reverse().map((s, i) => `Session ${i + 1}`)
      const scores = [...sessions].reverse().map((s) => s.average_score ?? null)

      chartInstance.current = new Chart(chartRef.current, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Score',
            data: scores,
            borderColor: '#84bbf6',
            backgroundColor: 'rgba(132,187,246,0.08)',
            borderWidth: 2,
            pointBackgroundColor: '#84bbf6',
            pointRadius: 4,
            tension: 0.4,
            fill: true,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#1d2023',
              borderColor: '#41474f',
              borderWidth: 1,
              titleColor: '#e1e2e7',
              bodyColor: '#c1c7d1',
            },
          },
          scales: {
            x: {
              grid: { color: '#41474f', lineWidth: 0.5 },
              ticks: { color: '#8b919a', font: { family: 'JetBrains Mono', size: 10 } },
            },
            y: {
              min: 0,
              max: 100,
              grid: { color: '#41474f', lineWidth: 0.5 },
              ticks: { color: '#8b919a', font: { family: 'JetBrains Mono', size: 10 } },
            },
          },
        },
      })
    }
    loadChart()

    return () => chartInstance.current?.destroy()
  }, [sessions])


  const totalSessions = sessions.length
  const scoredSessions = sessions.filter(s => s.average_score != null)
  const avgScore = scoredSessions.length
  ? Math.round(scoredSessions.reduce((a, s) => a + s.average_score, 0) / scoredSessions.length)
  : 0
  const completedSessions = sessions.filter((s) => s.end_reason !== 'force').length

  const stats = [
    { label: 'Total Sessions', value: totalSessions, icon: 'history' },
    { label: 'Avg. Score',     value: `${avgScore}%`, icon: 'analytics' },
    { label: 'Completed',      value: completedSessions, icon: 'task_alt' },
  ]

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <NavBar />

      <main className="flex-grow pt-32 pb-xl px-4 md:px-lg max-w-container-max mx-auto w-full">

        
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-xl gap-md">
          <div>
            <h1 className="font-display text-display-lg-mobile text-on-surface">Dashboard</h1>
            <p className="font-body text-body-md text-on-surface-variant mt-xs">
              Track your progress and review past sessions.
            </p>
          </div>
          <button
            onClick={() => navigate('/session')}
            className="flex items-center gap-xs py-sm px-lg bg-primary-container text-on-primary-container
                       font-label text-label-sm rounded-lg
                       hover:bg-primary hover:scale-[1.02]
                       transition-all duration-200 ease-in-out active:scale-[0.98]
                       whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span className="text-body-md font-medium">New Interview</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-lg mb-xl">
          {stats.map((s) => (
            <div key={s.label} className="bg-surface-container border border-outline-variant rounded-2xl p-lg">
              <div className="flex items-center justify-between mb-md">
                <span className="font-label text-label-sm text-on-surface-variant uppercase tracking-wider">
                  {s.label}
                </span>
                <span className="material-symbols-outlined text-primary-container text-[20px]">
                  {s.icon}
                </span>
              </div>
              <div className="font-display text-display-lg-mobile text-on-surface">
                {loading ? '—' : s.value}
              </div>
            </div>
          ))}
        </div>

    
        <div className="bg-surface-container border border-outline-variant rounded-2xl p-lg mb-xl">
          <div className="flex items-center justify-between mb-lg border-b border-outline-variant pb-md">
            <h2 className="font-headline text-headline-md text-on-surface">Performance Over Time</h2>
            <span className="font-label text-label-sm text-on-surface-variant uppercase tracking-wider">
              Score
            </span>
          </div>
          <div className="h-[240px]">
            {sessions.length === 0 && !loading ? (
              <div className="h-full flex items-center justify-center text-on-surface-variant font-body text-body-md">
                No sessions yet. Start an interview to see your progress.
              </div>
            ) : (
              <canvas ref={chartRef} />
            )}
          </div>
        </div>

        
        <div className="bg-surface-container border border-outline-variant rounded-2xl overflow-hidden">
          <div className="px-lg py-md border-b border-outline-variant flex items-center justify-between">
            <h2 className="font-headline text-headline-md text-on-surface">Session History</h2>
          </div>

          {loading ? (
            <div className="p-xl text-center text-on-surface-variant font-body text-body-md">Loading…</div>
          ) : sessions.length === 0 ? (
            <div className="p-xl text-center">
              <span className="material-symbols-outlined text-4xl text-outline mb-md block">inbox</span>
              <p className="font-body text-body-md text-on-surface-variant">No sessions yet.</p>
              <button
                onClick={() => navigate('/session')}
                className="mt-md inline-flex items-center gap-xs py-sm px-lg
                           bg-primary-container text-on-primary-container
                           font-label text-label-sm rounded-lg
                           hover:bg-primary transition-all duration-200"
              >
                Start your first interview
              </button>
            </div>
          ) : (
            <div className="divide-y divide-outline-variant">
              {sessions.map((s) => (
                <div key={s.id} className="px-lg py-md flex items-center justify-between hover:bg-surface-container-high transition-colors duration-150">
                  <div className="space-y-xs">
                    <div className="flex items-center gap-sm">
                      <span className="font-body text-body-md text-on-surface font-medium">
                        {s.subject || 'General Interview'}
                      </span>
                      <span className="font-label text-label-sm text-on-surface-variant uppercase">
                        {s.level || 'Intermediate'}
                      </span>
                    </div>
                    <span className="font-label text-label-sm text-outline">
                      {new Date(s.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-md">
                    <span
                      className={`font-label text-label-sm uppercase tracking-wider px-sm py-xs rounded-md
                        ${s.end_reason === 'force'
                          ? 'bg-error-container text-on-error-container'
                          : 'bg-secondary-container text-on-secondary-container'}`}
                    >
                      {s.end_reason === 'force' ? 'Force Ended' : 'Completed'}
                    </span>
                    {s.average_score != null && (
                     <span className="font-display text-headline-md text-primary-container">
                       {s.average_score}%
                     </span>
                   )}
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
