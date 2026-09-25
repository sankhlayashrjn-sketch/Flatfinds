/** Small original line-art icons for the property-card UI — plain strokes, no borrowed artwork. */

type IconProps = { className?: string };

export function BedIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={className}>
      <path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 18v2M21 18v2" strokeLinecap="round" />
      <path d="M3 13V7a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 10V7a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BathIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={className}>
      <path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 12V6a2 2 0 0 1 3.5-1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 19v1.5M18 19v1.5" strokeLinecap="round" />
    </svg>
  );
}

export function AreaIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={className}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="1.5" />
      <path d="M8 3.5V7M16 3.5V7M3.5 8H7M3.5 16H7M17 3.5V7M17 17v3.5M3.5 16h3.5" strokeLinecap="round" />
    </svg>
  );
}

export function FloorIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={className}>
      <rect x="4" y="3" width="16" height="18" rx="1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 9h16M4 15h16" strokeLinecap="round" />
      <path d="M8 6h.01M8 12h.01M8 18h.01" strokeLinecap="round" />
    </svg>
  );
}

export function HeartIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={className}>
      <path
        d="M12 20s-7-4.35-9.5-8.5C.8 8.3 2.2 5 5.5 5c1.9 0 3.3 1 4.5 2.6C11.2 6 12.6 5 14.5 5 17.8 5 19.2 8.3 21.5 11.5 19 15.65 12 20 12 20Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function VerifiedIcon({ className = "h-3.5 w-3.5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2.5 14.6 4l3-.4.9 2.9 2.5 1.8-1.2 2.8 1.2 2.8-2.5 1.8-.9 2.9-3-.4L12 21.5 9.4 20l-3 .4-.9-2.9-2.5-1.8 1.2-2.8-1.2-2.8 2.5-1.8.9-2.9 3 .4L12 2.5Z" />
      <path
        d="m8.5 12.5 2.2 2.2 4.3-4.9"
        stroke="white"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function HouseLogoIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 20v-5h4v5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** For "no listings match" / empty states. */
export function EmptySearchIllustration({ className = "h-24 w-24" }: IconProps) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className}>
      <circle cx="50" cy="50" r="48" fill="var(--accent)" opacity="0.08" />
      <circle cx="42" cy="42" r="18" stroke="var(--accent)" strokeWidth="4" />
      <line x1="55" y1="55" x2="72" y2="72" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" />
      <path d="M35 42h14M42 35v14" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** A small group-of-people-plus-home motif for the home page hero. */
export function GroupHomeIllustration({ className = "h-32 w-32" }: IconProps) {
  return (
    <svg viewBox="0 0 160 120" fill="none" className={className}>
      <path
        d="M30 70 70 38l40 32"
        stroke="var(--brand)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="40" y="70" width="60" height="34" rx="3" stroke="var(--brand)" strokeWidth="6" />
      <rect x="62" y="84" width="16" height="20" stroke="var(--brand)" strokeWidth="5" />
      <circle cx="122" cy="60" r="10" fill="var(--accent)" />
      <path d="M108 92c0-9 6-16 14-16s14 7 14 16" stroke="var(--accent)" strokeWidth="6" strokeLinecap="round" />
      <circle cx="18" cy="66" r="8" fill="var(--accent)" opacity="0.6" />
      <path d="M6 92c0-7 5-13 12-13s12 6 12 13" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}
