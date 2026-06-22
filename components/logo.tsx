export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img src="/images/logo2.png" alt="Qanoun Tech" className="h-20 object-contain scale-125" />
    </div>
  )
}

export function LogoIcon({ className = "" }: { className?: string }) {
  return <img src="/images/logo-icon.png" alt="Qanoun Tech" className={`h-10 w-10 object-contain ${className}`} />
}

export function LogoFull({ className = "" }: { className?: string }) {
  return <img src="/images/logo-full.png" alt="Qanoun Tech" className={`${className}`} />
}
