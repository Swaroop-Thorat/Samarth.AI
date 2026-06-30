import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabaseClient'

import AuthPage          from './components/AuthPage'
import ResetPasswordPage from './components/ResetPasswordPage'
import LandingPage       from './components/LandingPage'
import SessionForm       from './components/SessionForm'
import InterviewRoom     from './components/InterviewRoom'
import Dashboard         from './components/Dashboard'
import ContactHelp       from './components/ContactHelp'

function ProtectedRoute({ user, children }) {
  if (user === undefined) return null 
  if (!user) return <Navigate to="/auth" replace />
  return children
}

export default function App() {
  const [user, setUser] = useState(undefined) 

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  
  if (user === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-md">
          <div className="w-8 h-8 rounded-full border-2 border-primary-container border-t-transparent animate-spin" />
          <span className="font-label text-label-sm text-on-surface-variant uppercase tracking-wider">
            Loading…
          </span>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/auth"
          element={user ? <Navigate to="/" replace /> : <AuthPage />}
        />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route path="/" element={
          <ProtectedRoute user={user}><LandingPage /></ProtectedRoute>
        } />
        <Route path="/session" element={
          <ProtectedRoute user={user}><SessionForm /></ProtectedRoute>
        } />
        <Route path="/interview" element={
          <ProtectedRoute user={user}><InterviewRoom /></ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute user={user}><Dashboard /></ProtectedRoute>
        } />
        <Route path="/contact" element={
          <ProtectedRoute user={user}><ContactHelp /></ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
