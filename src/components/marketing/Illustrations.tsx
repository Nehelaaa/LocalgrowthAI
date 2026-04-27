import type { ComponentProps } from "react";

type SvgProps = ComponentProps<"svg">;

export function IllustrationRadar(props: SvgProps) {
  return (
    <svg viewBox="0 0 320 240" fill="none" aria-hidden {...props}>
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="320" y2="240" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7C3AED" stopOpacity="0.9" />
          <stop offset="1" stopColor="#2563EB" stopOpacity="0.7" />
        </linearGradient>
        <radialGradient id="rg" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(160 120) rotate(90) scale(108 144)">
          <stop stopColor="#A78BFA" stopOpacity="0.35" />
          <stop offset="1" stopColor="#0B1220" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="12" y="12" width="296" height="216" rx="22" fill="url(#rg)" />
      <rect x="18" y="18" width="284" height="204" rx="18" stroke="#6366F1" strokeOpacity="0.22" />
      <circle cx="160" cy="120" r="72" stroke="#6366F1" strokeOpacity="0.25" />
      <circle cx="160" cy="120" r="104" stroke="#6366F1" strokeOpacity="0.15" />
      <path d="M160 28V212" stroke="#6366F1" strokeOpacity="0.12" />
      <path d="M56 120H264" stroke="#6366F1" strokeOpacity="0.12" />
      <path d="M160 120L248 72" stroke="url(#lg)" strokeWidth="4" strokeLinecap="round" />
      <circle cx="248" cy="72" r="6" fill="#F59E0B" />
      <circle cx="112" cy="150" r="5" fill="#34D399" />
      <circle cx="196" cy="156" r="4.5" fill="#60A5FA" />
      <path
        d="M40 188c24-18 44-26 74-30 28-4 57 0 84-16 20-12 39-32 82-44"
        stroke="#94A3B8"
        strokeOpacity="0.35"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IllustrationPipeline(props: SvgProps) {
  return (
    <svg viewBox="0 0 320 240" fill="none" aria-hidden {...props}>
      <defs>
        <linearGradient id="pl" x1="30" y1="28" x2="290" y2="212" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7C3AED" stopOpacity="0.9" />
          <stop offset="1" stopColor="#2563EB" stopOpacity="0.85" />
        </linearGradient>
      </defs>
      <rect x="14" y="14" width="292" height="212" rx="22" fill="#0B1220" fillOpacity="0.04" />
      <rect x="20" y="20" width="280" height="200" rx="18" stroke="#6366F1" strokeOpacity="0.22" />
      <rect x="34" y="44" width="78" height="150" rx="14" fill="#FFFFFF" fillOpacity="0.7" stroke="#CBD5E1" strokeOpacity="0.7" />
      <rect x="121" y="44" width="78" height="150" rx="14" fill="#FFFFFF" fillOpacity="0.7" stroke="#CBD5E1" strokeOpacity="0.7" />
      <rect x="208" y="44" width="78" height="150" rx="14" fill="#FFFFFF" fillOpacity="0.7" stroke="#CBD5E1" strokeOpacity="0.7" />

      <rect x="44" y="60" width="58" height="18" rx="9" fill="#F59E0B" fillOpacity="0.22" />
      <rect x="44" y="90" width="58" height="18" rx="9" fill="#60A5FA" fillOpacity="0.22" />
      <rect x="44" y="120" width="58" height="18" rx="9" fill="#34D399" fillOpacity="0.22" />

      <rect x="131" y="68" width="58" height="18" rx="9" fill="url(#pl)" fillOpacity="0.18" />
      <rect x="131" y="98" width="58" height="18" rx="9" fill="#94A3B8" fillOpacity="0.18" />
      <rect x="131" y="128" width="58" height="18" rx="9" fill="#94A3B8" fillOpacity="0.18" />

      <rect x="218" y="84" width="58" height="18" rx="9" fill="#7C3AED" fillOpacity="0.18" />
      <rect x="218" y="114" width="58" height="18" rx="9" fill="#2563EB" fillOpacity="0.18" />

      <path d="M112 120h10" stroke="#6366F1" strokeOpacity="0.45" strokeWidth="3" strokeLinecap="round" />
      <path d="M199 120h10" stroke="#6366F1" strokeOpacity="0.45" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function IllustrationOutreach(props: SvgProps) {
  return (
    <svg viewBox="0 0 320 240" fill="none" aria-hidden {...props}>
      <defs>
        <linearGradient id="og" x1="40" y1="40" x2="280" y2="200" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7C3AED" stopOpacity="0.9" />
          <stop offset="1" stopColor="#2563EB" stopOpacity="0.85" />
        </linearGradient>
      </defs>
      <rect x="14" y="14" width="292" height="212" rx="22" fill="#0B1220" fillOpacity="0.04" />
      <rect x="20" y="20" width="280" height="200" rx="18" stroke="#6366F1" strokeOpacity="0.22" />
      <path
        d="M72 76c0-10 8-18 18-18h140c10 0 18 8 18 18v88c0 10-8 18-18 18H90c-10 0-18-8-18-18V76Z"
        fill="#FFFFFF"
        fillOpacity="0.72"
        stroke="#CBD5E1"
        strokeOpacity="0.7"
      />
      <path d="M86 82h148" stroke="#94A3B8" strokeOpacity="0.55" strokeWidth="6" strokeLinecap="round" />
      <path d="M86 106h120" stroke="#94A3B8" strokeOpacity="0.45" strokeWidth="6" strokeLinecap="round" />
      <path d="M86 130h92" stroke="#94A3B8" strokeOpacity="0.35" strokeWidth="6" strokeLinecap="round" />
      <path
        d="M208 156c0-6 5-11 11-11h28c6 0 11 5 11 11v8c0 6-5 11-11 11h-28c-6 0-11-5-11-11v-8Z"
        fill="url(#og)"
        fillOpacity="0.55"
      />
      <path d="M84 184c20-16 44-24 68-24 26 0 49 10 68 30" stroke="#6366F1" strokeOpacity="0.22" strokeWidth="3" strokeLinecap="round" />
      <circle cx="86" cy="184" r="5" fill="#F59E0B" />
      <circle cx="220" cy="184" r="5" fill="#34D399" />
    </svg>
  );
}

