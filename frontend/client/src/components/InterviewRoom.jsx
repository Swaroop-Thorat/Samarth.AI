import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

const API = import.meta.env.VITE_API_URL || 'https://samarth-ai.onrender.com'

export default function InterviewRoom() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const sessionConfig = state?.sessionConfig || {}

  const [messages, setMessages] = useState([])
  const [isMicOn, setIsMicOn] = useState(false)
  const [isAiSpeaking, setIsAiSpeaking] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [showExitDialog, setShowExitDialog] = useState(false)
  const [countdown, setCountdown] = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const [currentReport, setCurrentReport] = useState({ covered_topics: [], scores: {}, weak_concepts: [] })
  
  const currentReportRef = useRef(currentReport)
  const startedRef       = useRef(false)
  const mediaRecorderRef = useRef(null)
  const chunksRef        = useRef([])
  const speechRef        = useRef(null)
  const recordStartRef = useRef(0)
  const scrollRef        = useRef(null)
  const messagesRef      = useRef([])
  const offTopicRef      = useRef(0)
  const isAiSpeakingRef  = useRef(false)
  const sessionIdRef     = useRef(null)
  const maxQuestionsRef  = useRef(15)
  const questionCountRef = useRef(0)
  const isEndingRef      = useRef(false) 
  const pendingEvaluateRef = useRef(null) 
  const isBusyRef        = useRef(false) 
  const [isBusy, setIsBusy] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState(null) 

  const FALLBACK_CLOSING_LINE = "I'm having trouble connecting right now — let's pick this up another time. Thank you for your patience."

  useEffect(() => { messagesRef.current = messages }, [messages])
  useEffect(() => { currentReportRef.current = currentReport }, [currentReport])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code !== 'Space' && e.code !== 'Enter') return
      if (['INPUT', 'TEXTAREA', 'BUTTON'].includes(e.target.tagName)) return
      e.preventDefault()
      if (!isTranscribing) toggleMic()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMicOn, isTranscribing])

  const speak = useCallback((text) => {
    isAiSpeakingRef.current = true
    setIsAiSpeaking(true)

    window.speechSynthesis.cancel()

    setTimeout(() => {
      const utt = new SpeechSynthesisUtterance(text)
      utt.rate  = 0.95
      utt.pitch = 1
      utt.onstart = () => { setIsAiSpeaking(true);  isAiSpeakingRef.current = true  }
      utt.onend   = () => { setIsAiSpeaking(false); isAiSpeakingRef.current = false }
      utt.onerror = () => { setIsAiSpeaking(false); isAiSpeakingRef.current = false }
      speechRef.current = utt
      window.speechSynthesis.speak(utt)
    }, 50)
  }, [])

  const fetchChatWithRetry = useCallback(async (body, onStatus) => {
    const MAX_ATTEMPTS = 3
    const RETRY_DELAY_MS = 3500

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      if (attempt > 1) {
        onStatus?.(attempt)
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
      }
      try {
        const res = await fetch(`${API}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (data?.reply) return data
      } catch (err) {
        console.error(`/chat attempt ${attempt} failed:`, err.message)
      }
    }
    return null
  }, [])

  const endSession = useCallback(async (reason = 'natural') => {
    if (isEndingRef.current) return   
    isEndingRef.current = true

    window.speechSynthesis.cancel()
    mediaRecorderRef.current?.stop()

    if (pendingEvaluateRef.current) {
      try { await pendingEvaluateRef.current } catch (e) {  }
    }

    if (sessionIdRef.current) {
      try {
        await supabase
          .from('sessions')
          .update({ end_reason: reason })
          .eq('id', sessionIdRef.current)
      } catch (e) { console.error('Session update error:', e) }
    }

    let c = 5
    setCountdown(c)
    const t = setInterval(() => {
      c -= 1
      setCountdown(c)
      if (c <= 0) { clearInterval(t); navigate('/dashboard') }
    }, 1000)
  }, [navigate])

  const sendMessage = useCallback(async (userText) => {
    if (isEndingRef.current || isBusyRef.current) return
    isBusyRef.current = true
    setIsBusy(true)

    questionCountRef.current += 1
    const isLastQuestion = questionCountRef.current >= maxQuestionsRef.current

    const updated = [...messagesRef.current, { role: 'user', content: userText }]
    setMessages(updated)

    const releaseLock = () => {
      if (isEndingRef.current) return 
      isBusyRef.current = false
      setIsBusy(false)
    }

    try {
      const data = await fetchChatWithRetry(
        {
          messages: updated.slice(-6),
          sessionConfig,
          offTopicCount: offTopicRef.current,
          isLastQuestion,
        },
        (attempt) => setConnectionStatus(attempt)
      )

      setConnectionStatus(null)

      if (!data) {
        setMessages((prev) => [...prev, { role: 'assistant', content: FALLBACK_CLOSING_LINE }])
        speak(FALLBACK_CLOSING_LINE)
        let waited = 0
        const waitForSpeech = setInterval(() => {
          waited += 500
          if (!isAiSpeakingRef.current || waited >= 15000) {
            clearInterval(waitForSpeech)
            endSession('force')
          }
        }, 500)
        return
      }

      let aiText = data.reply || ''

      const wasOffTopic = aiText.trim().startsWith('[OFF_TOPIC]')
      if (wasOffTopic) {
        aiText = aiText.replace('[OFF_TOPIC]', '').trim()
        offTopicRef.current += 1
      }

      const cleanText = aiText.replace('[INTERVIEW_END]', '').trim()
      const aiEnded = aiText.includes('[INTERVIEW_END]')
      const offTopicExhausted = offTopicRef.current >= 4

      setMessages((prev) => [...prev, { role: 'assistant', content: cleanText }])
      speak(cleanText)

      pendingEvaluateRef.current = fetch(`${API}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionConfig,
          userMessage: userText,
          aiReply: cleanText,
          currentReport: currentReportRef.current,
        }),
      })
        .then((r) => r.json())
        .then(async (evalData) => {
          if (evalData?.scores) {
            currentReportRef.current = evalData
            setCurrentReport(evalData)
            if (sessionIdRef.current) {
              const vals = Object.values(evalData.scores)
              const avg = vals.length
                ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
                : null
              await supabase.from('sessions').update({
                scores:         evalData.scores,
                weak_concepts:  evalData.weak_concepts,
                average_score:  avg,
                question_count: messagesRef.current.filter(m => m.role === 'assistant').length,
              }).eq('id', sessionIdRef.current)
            }
          }
        })
        .catch((err) => console.error('Evaluate error (non-blocking):', err))

      if (aiEnded) {
        const reason = offTopicExhausted ? 'performance'
                     : isLastQuestion ? 'limit'
                     : 'natural'
        let waited = 0
        const waitForSpeech = setInterval(() => {
          waited += 500
          if (!isAiSpeakingRef.current || waited >= 15000) {
            clearInterval(waitForSpeech)
            endSession(reason)
          }
        }, 500)
      } else if (isLastQuestion || offTopicExhausted) {
        const reason = offTopicExhausted ? 'performance' : 'limit'
        let waited = 0
        const waitForSpeech = setInterval(() => {
          waited += 500
          if (!isAiSpeakingRef.current || waited >= 15000) {
            clearInterval(waitForSpeech)
            endSession(reason)
          }
        }, 500)
      } else {
        let waited = 0
        const waitForSpeech = setInterval(() => {
          waited += 300
          if (!isAiSpeakingRef.current || waited >= 15000) {
            clearInterval(waitForSpeech)
            releaseLock()
          }
        }, 300)
      }

    } catch (err) {
      console.error('Chat error:', err)
      releaseLock()
    }
  }, [sessionConfig, speak, endSession, fetchChatWithRetry])

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        const today = new Date().toISOString().split('T')[0]
        const { data: control } = await supabase
          .from('users_control')
          .select('sessions_today, last_session_date, sessions_per_day, max_questions')
          .eq('user_id', user.id)
          .single()

        const isNewDay = control.last_session_date !== today
        const newCount = isNewDay ? 1 : (control.sessions_today || 0) + 1

        if (!isNewDay && control.sessions_today >= control.sessions_per_day) {
          navigate('/dashboard', { state: { error: 'Daily session limit reached' } })
          return
        }

        if (control?.max_questions) maxQuestionsRef.current = control.max_questions

        await supabase.from('users_control').update({
          sessions_today:    newCount,
          last_session_date: today,
        }).eq('user_id', user.id)

        const { data } = await supabase
          .from('sessions')
          .insert({
            user_id: user.id,
            subject: sessionConfig.subject || 'General',
            config:  sessionConfig,
          })
          .select('id')
          .single()

        setSessionId(data?.id)
        sessionIdRef.current = data?.id

      } catch (e) { console.error('Session init error:', e) }

      const data = await fetchChatWithRetry(
        {
          messages: [{ role: 'user', content: '[INTERVIEW_START]' }],
          sessionConfig,
          offTopicCount: 0,
        },
        (attempt) => setConnectionStatus(attempt)
      )

      setConnectionStatus(null)

      if (!data) {
        setMessages([{ role: 'assistant', content: FALLBACK_CLOSING_LINE }])
        speak(FALLBACK_CLOSING_LINE)
        let waited = 0
        const waitForSpeech = setInterval(() => {
          waited += 500
          if (!isAiSpeakingRef.current || waited >= 15000) {
            clearInterval(waitForSpeech)
            endSession('force')
          }
        }, 500)
        return
      }

      const rawReply = data.reply
      const aiText = rawReply
        .replace('[INTERVIEW_START]', '')
        .replace('[OFF_TOPIC]', '')
        .replace('[INTERVIEW_END]', '')
        .trim()
      setMessages([{ role: 'assistant', content: aiText }])
      speak(aiText)
    }

    init()
    return () => window.speechSynthesis.cancel()
  }, []) 

  const toggleMic = async () => {
    if (isAiSpeakingRef.current || isBusyRef.current || connectionStatus !== null) return

    if (isMicOn) {  
      mediaRecorderRef.current?.stop()
      setIsMicOn(false)
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mr = new MediaRecorder(stream)
        chunksRef.current = []
        mr.ondataavailable = (e) => chunksRef.current.push(e.data)
        mr.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop())
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
          setIsTranscribing(true)
          try {
            const fd = new FormData()
            fd.append('audio', blob, 'audio.webm')
            const res = await fetch(`${API}/transcribe`, { method: 'POST', body: fd })
            const { text } = await res.json()
            if (text?.trim()) sendMessage(text.trim())
          } catch (e) { console.error('Transcribe error:', e) }
          finally { setIsTranscribing(false) }
        }
        recordStartRef.current = Date.now()
        mr.start(250)
        mediaRecorderRef.current = mr
        setIsMicOn(true)
      } catch (err) {
        console.error('Mic error:', err)
      }
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col font-body text-body-md overflow-hidden relative"
      style={{ backgroundColor: '#0B0D10', color: '#F5F7FA' }}
    >
     
      <header className="fixed top-0 w-full z-50 border-b border-brand-border-divider"
              style={{ backgroundColor: '#111417' }}>
        <div className="flex justify-between items-center h-16 px-lg max-w-container-max mx-auto">
          <div className="font-headline text-headline-md font-bold text-on-background tracking-tight">
            Samarth AI
          </div>
          <button
            onClick={() => setShowExitDialog(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-error/50
                       hover:bg-error/10 hover:border-error hover:scale-[1.02]
                       transition-all duration-200 ease-in-out text-error"
            style={{ background: 'rgba(19,23,28,0.8)' }}
          >
            <span
              className="material-symbols-outlined text-[18px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              close
            </span>
            <span className="font-medium text-sm">Force End</span>
          </button>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center relative px-lg pt-16">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] z-0 overflow-hidden">
          <h1 className="font-display text-[150px] md:text-[250px] lg:text-[300px] leading-none font-bold tracking-tighter select-none whitespace-nowrap">
            Samarth AI
          </h1>
        </div>

        <div className="w-full z-10 relative max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6 justify-center">
            <div className="w-8 h-8 rounded-full border flex items-center justify-center shadow-lg"
                 style={{ background: '#13171C', borderColor: '#2B333D' }}>
              <div className={`w-2 h-2 rounded-full bg-brand-primary ${isAiSpeaking ? 'animate-pulse' : 'opacity-40'}`} />
            </div>
            <span className="font-label text-label-sm text-outline tracking-widest uppercase">
              {connectionStatus !== null ? `Reconnecting (${connectionStatus}/3)...` : isAiSpeaking ? 'AI Interviewer Speaking' : isTranscribing ? 'Processing…' : 'AI Interviewer'}
            </span>
          </div>

          <div
            ref={scrollRef}
            className="rounded-3xl p-10 min-h-[300px] h-[50vh] overflow-y-auto relative"
            style={{
              background: 'rgba(19,23,28,0.8)',
              backdropFilter: 'blur(12px)',
              border: '2px solid rgba(91,140,255,0.5)',
              boxShadow: '0 0 30px rgba(91,140,255,0.25), 0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            <div className="space-y-6 font-body text-body-lg leading-relaxed flex flex-col justify-end h-full"
                 style={{ color: '#F5F7FA' }}>
              {messages
                .filter((m) => m.role === 'assistant')
                .slice(-3)
                .map((m, i) => (
                  <p key={i} style={{ animation: 'fadeInUp 0.4s ease forwards', opacity: 0 }}>
                    {m.content}
                  </p>
                ))}
              {messages.length === 0 && (
                <p className="text-outline italic">Connecting to Samarth AI…</p>
              )}
            </div>

            {isAiSpeaking && (
              <div className="absolute bottom-6 left-8 flex space-x-2 items-center opacity-70">
                <div className="w-1.5 h-1.5 bg-outline rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                <div className="w-1.5 h-1.5 bg-outline rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-1.5 h-1.5 bg-outline rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            )}
          </div>

          <div className={`mt-2 flex justify-center items-center transition-opacity duration-300 ${isMicOn ? 'opacity-100' : 'opacity-0'}`}>
            <div className="px-4 py-2 rounded-full border border-brand-border flex items-center gap-2"
                 style={{ background: '#1B2128' }}>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="font-label text-label-sm text-on-surface-variant uppercase">
                Listening to you…
              </span>
            </div>
          </div>
        </div>
      </main>

       <div className="fixed left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-6 bottom-[2%]"> <button
          onClick={toggleMic}
          disabled={isTranscribing || isAiSpeaking || isBusy || connectionStatus !== null}
          className={`flex items-center justify-center w-20 h-20 rounded-full border-2
                      transition-all duration-300 ease-in-out
                      hover:scale-[1.05] disabled:opacity-50 disabled:cursor-not-allowed
                      ${isMicOn ? 'border-brand-primary' : 'border-brand-border'}`}
          style={{
            background: isMicOn ? '#1B2128' : 'rgba(19,23,28,0.9)',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          <span
            className="material-symbols-outlined text-[32px]"
            style={{
              fontVariationSettings: isMicOn ? "'FILL' 1" : "'FILL' 0",
              color: isMicOn ? '#5B8CFF' : '#F5F7FA',
            }}
          >
            {isTranscribing ? 'hourglass_empty' : isMicOn ? 'mic' : 'mic_off'}
          </span>
        </button>
      </div>

      {countdown !== null && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
             style={{ background: 'rgba(11,13,16,0.95)' }}>
          <h2 className="font-display text-display-lg-mobile md:text-display-lg text-on-surface mb-md text-center px-4">Interview Complete</h2>
          <p className="font-body text-body-lg text-on-surface-variant mb-xl">
            Redirecting to dashboard in {countdown}…
          </p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary">
            Go Now
          </button>
        </div>
      )}

      {showExitDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center"
             style={{ background: 'rgba(11,13,16,0.85)' }}>
              <div className="card p-xl max-w-[384px] w-[90vw] mx-4 space-y-lg"  style={{ background: '#1d2023', border: '1px solid #41474f' }}>
            <div>
              <h3 className="font-headline text-headline-md text-on-surface mb-xs">End Interview?</h3>
              <p className="font-body text-body-md text-on-surface-variant">
                This will force-end your session and redirect you to the dashboard.
              </p>
            </div>
            <div className="flex gap-sm">
              <button
                onClick={() => setShowExitDialog(false)}
                className="flex-1 py-sm px-md rounded-lg border border-outline-variant
                           text-on-surface-variant font-body text-body-md
                           hover:border-outline transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowExitDialog(false); endSession('force') }}
                className="flex-1 py-sm px-md rounded-lg bg-error-container text-on-error-container
                           font-body text-body-md hover:opacity-90 transition-opacity duration-200"
              >
                Force End
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}