import Image from 'next/image'

interface BrandLogoProps {
  className?: string
  showTagline?: boolean
}

export function BrandLogo({ className = '', showTagline = false }: BrandLogoProps) {
  return (
    <span className={`inline-flex flex-col items-start leading-none ${className}`} dir="ltr">
      <span className="brand-wordmark relative block h-7 w-36 overflow-hidden">
        <Image
          src="/noxwear-wordmark.jpg"
          alt="NOXWear"
          width={1280}
          height={498}
          unoptimized
          preload
          className="absolute max-w-none"
          style={{
            width: '112.8%',
            height: 'auto',
            left: '-6.2%',
            top: '-70%',
          }}
        />
      </span>
      {showTagline ? (
        <span className="mt-1 text-[9px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
          Style • Identity
        </span>
      ) : null}
    </span>
  )
}

