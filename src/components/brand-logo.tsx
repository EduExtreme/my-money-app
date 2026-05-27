import type { SVGProps } from "react";

type BrandLogoProps = SVGProps<SVGSVGElement> & {
  showText?: boolean;
};

export function BrandLogo({ showText = true, ...props }: BrandLogoProps) {
  const width = showText ? 214 : 52;

  return (
    <svg aria-label="My Money App" role="img" viewBox={`0 0 ${width} 52`} fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <defs>
        <linearGradient id="brand-mark-gradient" x1="8" y1="8" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10B981" />
          <stop offset="1" stopColor="#047857" />
        </linearGradient>
        <radialGradient id="brand-mark-glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(26 26) rotate(90) scale(26)">
          <stop stopColor="#10B981" stopOpacity="0.32" />
          <stop offset="1" stopColor="#10B981" stopOpacity="0" />
        </radialGradient>
        <filter id="brand-soft-glow" x="-40%" y="-40%" width="180%" height="180%" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0.063 0 0 0 0 0.725 0 0 0 0 0.506 0 0 0 0.6 0" />
          <feBlend in="SourceGraphic" mode="screen" />
        </filter>
      </defs>

      <g filter="url(#brand-soft-glow)">
        <rect x="1" y="1" width="50" height="50" rx="17" fill="#064E3B" stroke="url(#brand-mark-gradient)" strokeOpacity="0.9" strokeWidth="1.5" />
        <rect x="6" y="6" width="40" height="40" rx="14" fill="url(#brand-mark-glow)" />
        <path d="M14.5 31.5C17.3 25.4 20.6 22.3 24.5 22.3C28.2 22.3 30 27.6 33.2 27.6C35.2 27.6 36.9 25.9 38.6 22.6" stroke="#F8FFF9" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15 34.8H38" stroke="#34D399" strokeOpacity="0.9" strokeWidth="2" strokeLinecap="round" />
        <circle cx="19" cy="17" r="3.2" fill="#F8FFF9" />
        <circle cx="26" cy="14" r="3.2" fill="#34D399" />
        <circle cx="33" cy="17" r="3.2" fill="#F8FFF9" />
        <path d="M21.8 15.8L23.2 15.1M28.9 15.1L30.3 15.8" stroke="#F8FFF9" strokeOpacity="0.82" strokeWidth="1.6" strokeLinecap="round" />
      </g>

      {showText ? (
        <g>
          <text x="64" y="22" fill="var(--foreground)" fontFamily="var(--font-app-sans), Ubuntu, Inter, sans-serif" fontSize="15" fontWeight="800" letterSpacing="-0.02em">
            My Money App
          </text>
          <text x="64" y="38" fill="#34D399" fontFamily="var(--font-app-sans), Ubuntu, Inter, sans-serif" fontSize="8.5" fontWeight="800" letterSpacing="0.22em">
            CONTROLE FAMILIAR
          </text>
        </g>
      ) : null}
    </svg>
  );
}
