import { useNavigate } from 'react-router-dom'
import NavBar from './NavBar'
import Footer from './Footer'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <NavBar />

      <main className="flex-grow pt-32 pb-xl px-4 md:px-lg max-w-container-max mx-auto w-full flex flex-col items-center justify-center min-h-[819px]">
        
        <section className="w-full flex flex-col items-center text-center max-w-3xl mx-auto space-y-8 relative">

          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[400px] bg-primary-container opacity-[0.03] blur-[100px] rounded-full pointer-events-none z-0" />

          <div className="z-10 space-y-6">
            <h1 className="font-display text-display-lg-mobile md:text-display-lg text-on-surface">
              Master Your Interviews with Samarth AI
            </h1>
            <p className="font-body text-body-lg text-on-surface-variant max-w-2xl mx-auto">
              Where Every Candidate Becomes Samarth for Every Interview.
            </p>
          </div>

          <div className="z-10 pt-4">
            <button
              onClick={() => navigate('/session')}
              className="bg-primary-container text-[#F5F7FA] rounded-xl px-8 py-4
                         font-body font-medium text-lg
                         hover:bg-[#7BA3FF] hover:scale-[1.02]
                         transition-all duration-200 ease-in-out
                         shadow-[0_0_20px_rgba(91,140,255,0.15)]"
            >
              Get Started Interview
            </button>
          </div>

          <div className="z-10 w-full mt-24 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel rounded-xl p-6 flex flex-col items-start text-left gap-4 hover:-translate-y-1 transition-transform duration-300">
              <span className="material-symbols-outlined icon-filled text-primary-container text-3xl">
                psychology
              </span>
              <div>
                <h3 className="font-headline text-headline-md text-sm mb-1 text-on-surface">
                  Adaptive AI Persona
                </h3>
                <p className="font-body text-body-md text-xs text-on-surface-variant">
                  Interviews scale in difficulty based on your real-time responses.
                </p>
              </div>
            </div>

            <div className="glass-panel rounded-xl p-6 flex flex-col items-start text-left gap-4 hover:-translate-y-1 transition-transform duration-300 md:-translate-y-4">
              <span className="material-symbols-outlined icon-filled text-primary-container text-3xl">
                analytics
              </span>
              <div>
                <h3 className="font-headline text-headline-md text-sm mb-1 text-on-surface">
                  Deep Analysis
                </h3>
                <p className="font-body text-body-md text-xs text-on-surface-variant">
                  Instant feedback on tone, technical accuracy, and pacing.
                </p>
              </div>
            </div>

            <div className="glass-panel rounded-xl p-6 flex flex-col items-start text-left gap-4 hover:-translate-y-1 transition-transform duration-300">
              <span className="material-symbols-outlined icon-filled text-primary-container text-3xl">
                cases
              </span>
              <div>
                <h3 className="font-headline text-headline-md text-sm mb-1 text-on-surface">
                  Industry Specific
                </h3>
                <p className="font-body text-body-md text-xs text-on-surface-variant">
                  Tailored scenarios for engineering, product, and leadership roles.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
