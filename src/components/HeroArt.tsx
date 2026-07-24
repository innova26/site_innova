function HeroArt() {
  return (
    <div className="hero-art">
      {/* Decorative blue blobs + concentric arc lines, echoing the reference */}
      <svg
        className="hero-art-svg"
        viewBox="0 0 520 560"
        role="presentation"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="blobA" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#3b8ff5" />
            <stop offset="1" stopColor="#1c5fd0" />
          </linearGradient>
          <linearGradient id="blobB" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#5aa9ff" />
            <stop offset="1" stopColor="#2f80ed" />
          </linearGradient>
          <radialGradient id="glow" cx="50%" cy="45%" r="55%">
            <stop offset="0" stopColor="#5aa9ff" stopOpacity="0.55" />
            <stop offset="1" stopColor="#5aa9ff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* soft glow */}
        <circle cx="270" cy="250" r="240" fill="url(#glow)" />

        {/* thin concentric arcs on the right */}
        <g
          fill="none"
          stroke="#3b8ff5"
          strokeOpacity="0.5"
          strokeWidth="2"
        >
          <path d="M470 90 A 210 210 0 0 1 470 470" />
          <path d="M440 120 A 175 175 0 0 1 440 440" />
          <path d="M410 150 A 140 140 0 0 1 410 410" />
          <path d="M382 178 A 108 108 0 0 1 382 382" />
        </g>

        {/* big brand circle */}
        <circle cx="250" cy="220" r="150" fill="url(#blobB)" opacity="0.9" />

        {/* organic blob reaching right */}
        <path
          fill="url(#blobA)"
          d="M300 300c58-14 92-70 150-58 55 11 66 82 30 120-42 44-118 34-168 66-46 30-96 54-140 24-49-33-40-108-6-150 33-40 78-56 134-2z"
          opacity="0.92"
        />

        {/* small accent bubble */}
        <circle cx="452" cy="300" r="30" fill="#8ec6ff" opacity="0.9" />
      </svg>

      {/* Glass info cards floating over the art */}
      <div className="hero-card hero-card-pulse">
        <svg viewBox="0 0 120 40" className="pulse-line" aria-hidden="true">
          <polyline
            points="0,24 18,24 26,10 36,34 48,4 58,24 78,24 86,16 96,28 120,24"
            fill="none"
            stroke="#3b8ff5"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div>
          <strong>Gestão em tempo real</strong>
          <span>Indicadores e conformidade ANS</span>
        </div>
      </div>

      <div className="hero-card hero-card-stat">
        <strong>100%</strong>
        <span>das cidades brasileiras</span>
      </div>

      <div className="hero-card hero-card-years">
        <strong>40</strong>
        <span>anos de mercado</span>
      </div>
    </div>
  )
}

export default HeroArt
