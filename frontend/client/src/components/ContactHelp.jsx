import NavBar from './NavBar'
import Footer from './Footer'

const steps = [
  {
    num: '01',
    title: 'Set Up Your Session',
    body: 'Fill in your subject, topics, and difficulty level — or just upload your resume PDF and let Samarth AI parse it automatically.',
    icon: 'tune',
  },
  {
    num: '02',
    title: 'Enter the Interview Room',
    body: 'You\'ll be placed in a distraction-free, fullscreen interview environment. Samarth AI begins the session immediately.',
    icon: 'record_voice_over',
  },
  {
    num: '03',
    title: 'Speak Your Answers',
    body: 'Hold the mic button to speak. Your voice is transcribed and sent to Samarth AI in real time — no typing required.',
    icon: 'mic',
  },
  {
    num: '04',
    title: 'Review on the Dashboard',
    body: 'After the session ends, your performance score, weak areas, and full transcript are saved to your dashboard.',
    icon: 'analytics',
  },
]

const limits = [
  {
    title: 'Session Length',
    value: '45 min',
    note: 'Max per interview',
    icon: 'timer',
  },
  {
    title: 'Resume Size',
    value: '10 MB',
    note: 'PDF only',
    icon: 'description',
  },
  {
    title: 'Sessions / Day',
    value: 'Unlimited',
    note: 'On all plans',
    icon: 'all_inclusive',
  },
]

export default function ContactHelp() {
  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <NavBar />

      <main className="flex-grow pt-32 pb-xl px-4 md:px-lg max-w-container-max mx-auto w-full">

       
        <div className="mb-xl max-w-2xl">
          <h1 className="font-display text-display-lg-mobile text-on-surface mb-xs">
            Help & Contact
          </h1>
          <p className="font-body text-body-lg text-on-surface-variant">
            Everything you need to get the most out of Samarth AI.
          </p>
        </div>

        <section className="mb-xl">
          <h2 className="font-headline text-headline-md text-on-surface mb-lg border-b border-outline-variant pb-md">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            {steps.map((s) => (
              <div key={s.num} className="bg-surface-container border border-outline-variant rounded-2xl p-lg flex gap-lg">
                <div className="shrink-0">
                  <span className="font-label text-label-sm text-primary-container uppercase tracking-widest">
                    {s.num}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-sm mb-xs">
                    <span className="material-symbols-outlined text-primary-container text-[18px]">
                      {s.icon}
                    </span>
                    <h3 className="font-headline text-headline-md text-sm text-on-surface">
                      {s.title}
                    </h3>
                  </div>
                  <p className="font-body text-body-md text-on-surface-variant">
                    {s.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        
        <section className="mb-xl">
          <h2 className="font-headline text-headline-md text-on-surface mb-lg border-b border-outline-variant pb-md">
            Platform Limits
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
            {limits.map((l) => (
              <div key={l.title} className="bg-surface-container border border-outline-variant rounded-2xl p-lg">
                <div className="flex items-center gap-sm mb-md">
                  <span className="material-symbols-outlined text-primary-container text-[20px]">
                    {l.icon}
                  </span>
                  <span className="font-label text-label-sm text-on-surface-variant uppercase tracking-wider">
                    {l.title}
                  </span>
                </div>
                <div className="font-display text-display-lg-mobile text-on-surface">
                  {l.value}
                </div>
                <div className="font-label text-label-sm text-outline mt-xs uppercase tracking-wider">
                  {l.note}
                </div>
              </div>
            ))}
          </div>
        </section>

        
        <section className="bg-surface-container border border-outline-variant rounded-2xl p-lg">
          <h2 className="font-headline text-headline-md text-on-surface mb-md">
            Contact Us
          </h2>
          <p className="font-body text-body-md text-on-surface-variant mb-lg">
            Having an issue or want to share feedback? Reach out directly.
          </p>
          <div className="flex flex-col sm:flex-row gap-md">
            <a
              href="mailto:sthorat6663@gmail.com"
              className="flex items-center gap-sm px-lg py-sm rounded-lg border border-outline-variant
                         text-on-surface font-body text-body-md
                         hover:border-primary-container hover:text-primary
                         transition-all duration-200"
            >
              <span className="material-symbols-outlined text-[18px]">mail</span>
              sthorat6663@gmail.com
            </a>
            <a
              href="https://www.linkedin.com/in/swaroop-thorat-140358349"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-sm px-lg py-sm rounded-lg border border-outline-variant
                         text-on-surface font-body text-body-md
                         hover:border-primary-container hover:text-primary
                         transition-all duration-200"
            >
              <span className="material-symbols-outlined text-[18px]">link</span>
              LinkedIn
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
