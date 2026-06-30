import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setSuccess(true)
      setTimeout(() => navigate('/auth'), 2000)
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
              Reset Password
            </h2>
            <p className="font-body text-body-lg text-on-surface-variant">
              Enter your new credentials below.
            </p>
          </div>

          {error && (
            <div className="mb-md px-md py-sm rounded-lg bg-error-container text-on-error-container font-body text-body-md text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-md px-md py-sm rounded-lg bg-secondary-container text-on-secondary-container font-body text-body-md text-sm">
              Password updated! Redirecting to login…
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-xl">
            <div className="space-y-base">
              <label
                htmlFor="new_password"
                className="block font-label text-label-sm text-on-surface-variant uppercase tracking-wider"
              >
                New Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute inset-y-0 left-0 flex items-center pl-sm text-outline-variant pointer-events-none">
                  lock
                </span>
                <input
                  id="new_password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-xs py-md px-lg
                         bg-primary-container text-on-primary-container
                         font-label text-label-sm rounded-lg
                         hover:bg-primary hover:scale-[1.02]
                         transition-all duration-200 ease-in-out
                         active:scale-[0.98]
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-body-md font-medium">
                {loading ? 'Updating…' : 'Update Password'}
              </span>
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
          </form>

          <div className="mt-xl pt-xl border-t border-outline-variant text-center">
            <button
              onClick={() => navigate('/auth')}
              className="inline-flex items-center gap-xs font-label text-label-sm text-on-surface-variant hover:text-primary transition-colors duration-200"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Return to Login
            </button>
          </div>
        </div>

    
        <div className="mt-xl pt-xl border-t border-outline-variant flex items-center justify-between">
          <div className="flex items-center gap-lg">
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="text-on-surface-variant hover:text-primary transition-colors duration-200"
            >
              <span className="material-symbols-outlined text-[20px]">share</span>
            </a>
            <a
              href="mailto:contact@samarth.ai"
              aria-label="Email"
              className="text-on-surface-variant hover:text-primary transition-colors duration-200"
            >
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
