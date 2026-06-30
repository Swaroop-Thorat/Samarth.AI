import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function NavBar() {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path) => location.pathname === path

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/auth')
  }

  return (
    <nav className="fixed top-0 w-full z-50 bg-background border-b border-outline-variant">
      <div className="flex justify-between items-center h-16 px-lg max-w-container-max mx-auto">

        <Link
          to="/"
          className="font-headline text-headline-md font-bold text-on-background tracking-tight"
        >
          Samarth AI
        </Link>

        <div className="hidden md:flex gap-lg items-center h-full">
          <Link
            to="/"
            className={`font-body text-body-md h-full flex items-center transition-all duration-200 ease-in-out
              ${isActive('/') ? 'text-primary font-bold border-b-2 border-primary pb-px' : 'text-on-surface-variant hover:text-primary hover:scale-105'}`}
          >
            Home
          </Link>
          <Link
            to="/dashboard"
            className={`font-body text-body-md h-full flex items-center transition-all duration-200 ease-in-out
              ${isActive('/dashboard') ? 'text-primary font-bold border-b-2 border-primary pb-px' : 'text-on-surface-variant hover:text-primary hover:scale-105'}`}
          >
            Dashboard
          </Link>
          <Link
            to="/contact"
            className={`font-body text-body-md h-full flex items-center transition-all duration-200 ease-in-out
              ${isActive('/contact') ? 'text-primary font-bold border-b-2 border-primary pb-px' : 'text-on-surface-variant hover:text-primary hover:scale-105'}`}
          >
            Contact
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleLogout}
            className="hidden md:block btn-secondary"
          >
            Logout
          </button>
          
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden flex items-center p-2 text-on-surface-variant hover:text-primary transition-colors"
            aria-label="Toggle Menu"
          >
            <span className="material-symbols-outlined text-[28px]">
              {isOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-background border-b border-outline-variant px-lg py-md flex flex-col gap-md shadow-lg z-40">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className={`font-body text-body-md py-2 transition-colors ${isActive('/') ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary'}`}
          >
            Home
          </Link>
          <Link
            to="/dashboard"
            onClick={() => setIsOpen(false)}
            className={`font-body text-body-md py-2 transition-colors ${isActive('/dashboard') ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary'}`}
          >
            Dashboard
          </Link>
          <Link
            to="/contact"
            onClick={() => setIsOpen(false)}
            className={`font-body text-body-md py-2 transition-colors ${isActive('/contact') ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary'}`}
          >
            Contact
          </Link>
          <button
            onClick={() => { setIsOpen(false); handleLogout(); }}
            className="btn-secondary w-full mt-sm"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  )
}