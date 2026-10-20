import { useId } from "react";

export interface LogoIconProps {
  variant?: "sidebar" | "login" | "subtle";
  className?: string;
  size?: number | string;
}

export function LogoIcon({ variant = "sidebar", className = "h-11 w-11", size }: LogoIconProps) {
  const rawId = useId();
  // Sanitize id for SVG url references (React's useId has colons like :r1:)
  const id = rawId.replace(/:/g, "_");
  const bgGradId = `climatiza-bg-${id}`;
  const iconGradId = `climatiza-icon-${id}`;
  const shadowId = `climatiza-shadow-${id}`;

  const isSidebar = variant === "sidebar";

  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      aria-label="Emblema Climatiza"
      role="img"
    >
      <defs>
        <linearGradient id={bgGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          {isSidebar ? (
            <>
              <stop offset="0%" stopColor="#F8D7B5" />
              <stop offset="100%" stopColor="#E5B888" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#F8CDA0" />
              <stop offset="100%" stopColor="#D58E5D" />
            </>
          )}
        </linearGradient>

        <linearGradient id={iconGradId} x1="15%" y1="15%" x2="85%" y2="85%">
          <stop offset="0%" stopColor="#182323" />
          <stop offset="100%" stopColor="#28443E" />
        </linearGradient>

        <filter id={shadowId} x="-10%" y="-10%" width="120%" height="125%">
          <feDropShadow dx="0" dy="1.2" stdDeviation="1" floodColor="#182323" floodOpacity="0.14" />
        </filter>
      </defs>

      {/* Squircle Badge */}
      <rect width="48" height="48" rx="15" fill={`url(#${bgGradId})`} />
      <rect
        x="0.5"
        y="0.5"
        width="47"
        height="47"
        rx="14.5"
        stroke="#FFFFFF"
        strokeOpacity={isSidebar ? 0.35 : 0.4}
        fill="none"
      />

      {/* Emblem Graphic: Aerodynamic C contour + HVAC breeze stream + cooling diamond */}
      <g filter={`url(#${shadowId})`}>
        {/* Dynamic C arc */}
        <path
          d="M 33.5 13.5 C 28.5 8.5 19.8 8.5 14.8 13.8 C 9.2 19.5 9.2 28.5 14.8 34.2 C 19.8 39.5 28.5 39.5 33.5 34.5"
          stroke={`url(#${iconGradId})`}
          strokeWidth="4.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Top airflow wave */}
        <path
          d="M 18.5 19.5 C 22.5 18 26.5 18 30 19.5"
          stroke={`url(#${iconGradId})`}
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="34" cy="19.5" r="1.5" fill="#182323" />

        {/* Center airflow stream + ice diamond spark */}
        <path
          d="M 15.5 24 L 30 24"
          stroke={`url(#${iconGradId})`}
          strokeWidth="2.6"
          strokeLinecap="round"
          fill="none"
        />
        <path d="M 35 24 L 37.5 21.5 L 40 24 L 37.5 26.5 Z" fill="#182323" />

        {/* Bottom airflow wave */}
        <path
          d="M 18.5 28.5 C 22.5 30 26.5 30 30 28.5"
          stroke={`url(#${iconGradId})`}
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="34" cy="28.5" r="1.5" fill="#182323" />
      </g>
    </svg>
  );
}

export interface LogoProps {
  variant?: "sidebar" | "login" | "subtle";
  subtitle?: string;
  iconClassName?: string;
  className?: string;
}

export function Logo({
  variant = "sidebar",
  subtitle = "Operação",
  iconClassName,
  className = "flex items-center gap-3",
}: LogoProps) {
  const isSidebar = variant === "sidebar";

  return (
    <div className={className}>
      <LogoIcon
        variant={variant}
        className={iconClassName ?? (isSidebar ? "h-11 w-11 shrink-0" : "h-12 w-12 shrink-0")}
      />
      <div>
        {isSidebar ? (
          <>
            <p className="text-xl font-black tracking-tight text-[#fffaf3]">Climatiza</p>
            {subtitle && (
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#d5d0c7]">{subtitle}</p>
            )}
          </>
        ) : (
          <>
            {subtitle && (
              <p className="text-xs uppercase tracking-[0.22em] text-[#5f6a62]">{subtitle}</p>
            )}
            <p className="text-2xl font-black tracking-tight text-[#1f2a2a]">Climatiza</p>
          </>
        )}
      </div>
    </div>
  );
}

