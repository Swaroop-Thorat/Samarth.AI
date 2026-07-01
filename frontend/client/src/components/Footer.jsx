export default function Footer() {
  return (
    <footer className="w-full py-xl bg-surface-container-lowest border-t border-outline-variant mt-auto">
      <div className="flex flex-row justify-between items-center px-lg max-w-container-max mx-auto">

        <div className="font-headline text-headline-md font-bold text-on-surface tracking-tight">
          Samarth AI
        </div>

        <div className="flex gap-lg items-center">
          <a
            href="https://www.linkedin.com/in/swaroop-thorat-140358349"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="text-on-surface-variant hover:text-on-surface transition-colors duration-200
                       flex items-center justify-center w-10 h-10 rounded-full
                       bg-surface-variant hover:bg-primary-container hover:text-on-primary-container"
          >
            <span className="material-symbols-outlined">link</span>
          </a>
          <a
            href="mailto:sthorat6663@gmail.com"
            aria-label="Email"
            className="text-on-surface-variant hover:text-on-surface transition-colors duration-200
                       flex items-center justify-center w-10 h-10 rounded-full
                       bg-surface-variant hover:bg-primary-container hover:text-on-primary-container"
          >
            <span className="material-symbols-outlined">mail</span>
          </a>
        </div>

      </div>
    </footer>
  )
}