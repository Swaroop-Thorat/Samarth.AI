import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import NavBar from './NavBar'
import Footer from './Footer'

const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert']

export default function SessionForm() {
  const [tab, setTab] = useState('manual')
  const [form, setForm] = useState({
    subject: '',
    topics: '',
    concepts: '',
    notes: '',
    level: 'Intermediate',
  })
  const [resumeFile, setResumeFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sessionLimitError, setSessionLimitError] = useState(false)
  const fileRef = useRef()
  const navigate = useNavigate()
  
  useEffect(() => {
    const checkLimit = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: control } = await supabase
          .from('users_control')
          .select('sessions_per_day, last_session_date, sessions_today')
          .eq('user_id', user.id)
          .single()

        if (!control) return

        const today = new Date().toISOString().split('T')[0]
        const isNewDay = control.last_session_date !== today
        const sessionsUsed = isNewDay ? 0 : (control.sessions_today || 0)

        if (sessionsUsed >= control.sessions_per_day) {
          setSessionLimitError(true)
        }
      } catch (e) {
        console.error('Limit check error:', e)
      }
    }
    checkLimit()
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e) => {
    setResumeFile(e.target.files[0] || null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let sessionConfig

      if (tab === 'manual') {
        if (!form.subject.trim()) throw new Error('Subject is required.')
        sessionConfig = { ...form, source: 'manual' }
      } else {
        if (!resumeFile) throw new Error('Please upload a resume PDF.')

        const data = new FormData()
        data.append('resume', resumeFile)

        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/summarize-resume`, {
          method: 'POST',
          body: data,
        })
        if (!res.ok) throw new Error('Failed to parse resume.')
        const json = await res.json()
        sessionConfig = { ...json, source: 'resume' }
      }

      navigate('/interview', { state: { sessionConfig } })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <NavBar />

      <main className="flex-grow pt-32 pb-xl px-4 md:px-lg max-w-container-max mx-auto w-full">
        <div className="max-w-2xl mx-auto">

          <div className="mb-xl">
            <h1 className="font-display text-display-lg-mobile text-on-surface mb-xs">
              Setup Interview
            </h1>
            <p className="font-body text-body-lg text-on-surface-variant">
              Configure your session or upload a resume to auto-fill.
            </p>
          </div>

          {sessionLimitError && (
            <div className="mb-xl px-lg py-md rounded-xl bg-error-container text-on-error-container border border-error/50 space-y-sm">
              <div className="flex items-start gap-md">
                <span className="material-symbols-outlined text-[20px] flex-shrink-0">
                  schedule
                </span>
                <div>
                  <h3 className="font-headline text-headline-md text-sm mb-xs">Daily Limit Reached</h3>
                  <p className="font-body text-body-md">
                    You've used all your interview sessions for today. Come back tomorrow to continue practicing.
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && !sessionLimitError && (
            <div className="mb-md px-md py-sm rounded-lg bg-error-container text-on-error-container font-body text-body-md text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className={`space-y-lg ${sessionLimitError ? 'opacity-50 pointer-events-none' : ''}`}>

            <div className="flex gap-xs mb-xl border-b border-outline-variant">
              <button
                onClick={() => { setTab('manual'); setError('') }}
                className={`pb-sm px-md font-body text-body-md transition-all duration-200
                  ${tab === 'manual'
                    ? 'text-primary border-b-2 border-primary font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                Manual Setup
              </button>
              <button
                onClick={() => { setTab('resume'); setError('') }}
                className={`pb-sm px-md font-body text-body-md transition-all duration-200
                  ${tab === 'resume'
                    ? 'text-primary border-b-2 border-primary font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                Upload Resume
              </button>
            </div>

            {tab === 'manual' ? (
              <>
                <div className="space-y-base">
                  <label className="block font-label text-label-sm text-on-surface-variant uppercase tracking-wider">
                    Course *
                  </label>
                  <input
                    name="subject"
                    type="text"
                    required
                    placeholder="e.g. Computer Science, Pharmacy, Agriculture"
                    value={form.subject}
                    onChange={handleChange}
                    className="block w-full px-md py-md bg-surface border border-outline-variant rounded-lg
                               font-body text-body-md text-on-surface placeholder:text-outline
                               focus:border-primary-container focus:ring-1 focus:ring-primary-container
                               outline-none transition-colors duration-200"
                  />
                </div>

                <div className="space-y-base">
                  <label className="block font-label text-label-sm text-on-surface-variant uppercase tracking-wider">
                    Subject
                  </label>
                  <input
                    name="topics"
                    type="text"
                    placeholder="e.g. Entomology, Mechatronics, System Design"
                    value={form.topics}
                    onChange={handleChange}
                    className="block w-full px-md py-md bg-surface border border-outline-variant rounded-lg
                               font-body text-body-md text-on-surface placeholder:text-outline
                               focus:border-primary-container focus:ring-1 focus:ring-primary-container
                               outline-none transition-colors duration-200"
                  />
                </div>

                <div className="space-y-base">
                  <label className="block font-label text-label-sm text-on-surface-variant uppercase tracking-wider">
                    Topics
                  </label>
                  <input
                    name="concepts"
                    type="text"
                    placeholder="e.g. Heat Transfer, Balance Sheets, Context Switching"
                    value={form.concepts}
                    onChange={handleChange}
                    className="block w-full px-md py-md bg-surface border border-outline-variant rounded-lg
                               font-body text-body-md text-on-surface placeholder:text-outline
                               focus:border-primary-container focus:ring-1 focus:ring-primary-container
                               outline-none transition-colors duration-200"
                  />
                </div>

                <div className="space-y-base">
                  <label className="block font-label text-label-sm text-on-surface-variant uppercase tracking-wider">
                    Detailed Concepts (optional)
                  </label>
                  <textarea
                    name="notes"
                    rows={3}
                    placeholder="e.g. specific theorems, case studies, or formulas to focus on…"
                    value={form.notes}
                    onChange={handleChange}
                    className="block w-full px-md py-md bg-surface border border-outline-variant rounded-lg
                               font-body text-body-md text-on-surface placeholder:text-outline
                               focus:border-primary-container focus:ring-1 focus:ring-primary-container
                               outline-none transition-colors duration-200 resize-none"
                  />
                </div>

                <div className="space-y-base">
                  <label className="block font-label text-label-sm text-on-surface-variant uppercase tracking-wider">
                    Level
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-sm">
                    {LEVELS.map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setForm({ ...form, level: lvl })}
                        className={`py-sm px-md rounded-lg border font-label text-label-sm uppercase tracking-wider
                                    transition-all duration-200
                                    ${form.level === lvl
                                      ? 'border-primary-container bg-primary-container/10 text-primary'
                                      : 'border-outline-variant text-on-surface-variant hover:border-outline hover:text-on-surface'}`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-base">
                <label className="block font-label text-label-sm text-on-surface-variant uppercase tracking-wider">
                  Resume PDF *
                </label>
                <div
                  onClick={() => fileRef.current.click()}
                  className="border-2 border-dashed border-outline-variant rounded-xl p-xl
                             flex flex-col items-center justify-center gap-md cursor-pointer
                             hover:border-primary-container transition-colors duration-200"
                >
                  <span className="material-symbols-outlined text-4xl text-outline">upload_file</span>
                  <div className="text-center">
                    <p className="font-body text-body-md text-on-surface">
                      {resumeFile ? resumeFile.name : 'Click to upload PDF'}
                    </p>
                    <p className="font-label text-label-sm text-outline mt-base">
                      Max 10MB · PDF only
                    </p>
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || sessionLimitError}
              className="w-full flex items-center justify-center gap-xs py-md px-lg
                         bg-primary-container text-on-primary-container
                         font-label text-label-sm rounded-lg
                         hover:bg-primary hover:scale-[1.02]
                         transition-all duration-200 ease-in-out
                         active:scale-[0.98]
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-body-md font-medium">
                {loading ? 'Preparing…' : 'Start Interview'}
              </span>
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  )
}