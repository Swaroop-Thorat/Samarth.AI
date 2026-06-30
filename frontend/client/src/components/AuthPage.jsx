import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [college, setCollege] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        navigate('/')
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name, college }
          }
        })
        if (error) throw error
        const newUser = data?.user
        
        setMessage('Check your email for a confirmation link.')
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })
        if (error) throw error
        setMessage('Password reset email sent. Check your inbox.')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-surface-container-low text-on-background min-h-screen flex items-center justify-center p-md antialiased">
      <div className="w-full max-w-[480px]">
        <div className="text-center mb-xl">
          <h1 className="font-headline text-display-lg-mobile text-on-surface tracking-tight">
            Samarth AI
          </h1>
        </div>
        <div className="w-full">
          <div className="text-center mb-xl">
            <h2 className="font-headline text-display-lg-mobile text-on-surface mb-xs">
              {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Forgot Password'}
            </h2>
            <p className="font-body text-body-lg text-on-surface-variant">
              {mode === 'login'
                ? 'Sign in to continue your interview prep.'
                : mode === 'signup'
                ? 'Start mastering your interviews today.'
                : 'Enter your email to reset your password.'}
            </p>
          </div>
          {error && (
            <div className="mb-md px-md py-sm rounded-lg bg-error-container text-on-error-container font-body text-body-md text-sm">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-md px-md py-sm rounded-lg border border-primary-container text-primary font-body text-body-md text-sm text-center">
              {message}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-xl">
            {mode === 'signup' && (
              <>
                <div className="space-y-base">
                  <label htmlFor="name" className="block font-label text-label-sm text-on-surface-variant uppercase tracking-wider">
                    Name
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined input-icon absolute inset-y-0 left-0 flex items-center pl-sm text-outline-variant pointer-events-none">
                      person
                    </span>
                    <input id="name" type="text" required placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} className="input-field" />
                  </div>
                </div>
                <div className="space-y-base">
                  <label htmlFor="college" className="block font-label text-label-sm text-on-surface-variant uppercase tracking-wider">
                    College
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined input-icon absolute inset-y-0 left-0 flex items-center pl-sm text-outline-variant pointer-events-none">
                      school
                    </span>
                    <input id="college" type="text" required placeholder="Your college / university" value={college} onChange={(e) => setCollege(e.target.value)} className="input-field" />
                  </div>
                </div>
              </>
            )}
            <div className="space-y-base">
              <label htmlFor="email" className="block font-label text-label-sm text-on-surface-variant uppercase tracking-wider">
                Email
              </label>
              <div className="relative">
                <span className="material-symbols-outlined input-icon absolute inset-y-0 left-0 flex items-center pl-sm text-outline-variant pointer-events-none">
                  mail
                </span>
                <input id="email" type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" />
              </div>
            </div>
            {mode !== 'forgot' && (
              <div className="space-y-base">
                <label htmlFor="password" className="block font-label text-label-sm text-on-surface-variant uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined input-icon absolute inset-y-0 left-0 flex items-center pl-sm text-outline-variant pointer-events-none">
                    lock
                  </span>
                  <input id="password" type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" />
                </div>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-xs py-md px-lg bg-primary-container text-on-primary-container font-label text-label-sm rounded-lg hover:bg-primary hover:scale-[1.02] transition-all duration-200 ease-in-out active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-body-md font-medium">
                {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
              </span>
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
          </form>
          <div className="mt-xl pt-xl border-t border-outline-variant space-y-sm text-center">
            {mode === 'login' && (
              <>
                <button onClick={() => { setMode('forgot'); setError(''); setMessage('') }} className="block w-full font-label text-label-sm text-on-surface-variant hover:text-primary transition-colors duration-200">
                  Forgot your password?
                </button>
                <button onClick={() => { setMode('signup'); setError(''); setMessage('') }} className="block w-full font-label text-label-sm text-on-surface-variant hover:text-primary transition-colors duration-200">
                  Don't have an account? <span className="text-primary">Sign up</span>
                </button>
              </>
            )}
            {mode === 'signup' && (
              <button onClick={() => { setMode('login'); setError(''); setMessage('') }} className="inline-flex items-center gap-xs font-label text-label-sm text-on-surface-variant hover:text-primary transition-colors duration-200">
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Back to Sign In
              </button>
            )}
            {mode === 'forgot' && (
              <button onClick={() => { setMode('login'); setError(''); setMessage('') }} className="inline-flex items-center gap-xs font-label text-label-sm text-on-surface-variant hover:text-primary transition-colors duration-200">
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Return to Login
              </button>
            )}
          </div>
        </div>
        <div className="mt-xl pt-xl border-t border-outline-variant flex items-center justify-between">
          <div className="flex items-center gap-lg">
            <a href="https://www.linkedin.com/in/swaroop-thorat-140358349" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-on-surface-variant hover:text-primary transition-colors duration-200">
              <span className="material-symbols-outlined text-[20px]">share</span>
            </a>
            <a href="mailto:sthorat6663@gmail.com" aria-label="Email" className="text-on-surface-variant hover:text-primary transition-colors duration-200">
              <span className="material-symbols-outlined text-[20px]">mail</span>
            </a>
          </div>
          <span className="font-label text-label-sm text-on-surface-variant uppercase tracking-wider">
            Samarth AI
          </span>
        </div>
      </div>
    </div>
  )
}