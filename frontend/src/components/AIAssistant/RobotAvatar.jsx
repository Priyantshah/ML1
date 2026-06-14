import React from 'react';
import './RobotAvatar.css';

const RobotAvatar = ({ size = 56 }) => {
  return (
    <div className="dynamic-robot-container" style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 100 100"
        className="robot-svg floating-avatar"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="metalHead" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
          <linearGradient id="visorGlow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="50%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
          <linearGradient id="jacketGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <radialGradient id="eyeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff" stopOpacity="1" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Aura / Glow */}
        <circle cx="50" cy="50" r="45" fill="#38bdf8" opacity="0.1" className="robot-aura" />

        {/* --- Antenna --- */}
        <line x1="50" y1="7" x2="50" y2="18" stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
        <circle cx="50" cy="5" r="4" fill="#38bdf8" className="antenna-light" />

        {/* --- Ears --- */}
        <rect x="22" y="32" width="6" height="16" rx="3" fill="#64748b" />
        <rect x="72" y="32" width="6" height="16" rx="3" fill="#64748b" />

        {/* --- Head --- */}
        <path d="M28 25 C 28 15, 72 15, 72 25 L 72 50 C 72 60, 28 60, 28 50 Z" fill="url(#metalHead)" />

        {/* Visor Area */}
        <rect x="33" y="28" width="34" height="16" rx="8" fill="#1e293b" />

        {/* Dynamic Glowing Eyes */}
        <circle cx="42" cy="36" r="4" fill="url(#visorGlow)" className="robot-eye left-eye" />
        <circle cx="58" cy="36" r="4" fill="url(#visorGlow)" className="robot-eye right-eye" />

        {/* Friendly Screen Smile */}
        <path d="M43 41 Q 50 44 57 41" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.8" />

        {/* Neck */}
        <rect x="42" y="55" width="16" height="8" fill="#475569" />

        {/* --- Body / Clothes (Jacket) --- */}
        <path d="M15 95 C 15 75, 85 75, 85 95 L 85 100 L 15 100 Z" fill="url(#jacketGradient)" stroke="#3b82f6" strokeWidth="2" />

        {/* Shirt Collar */}
        <path d="M38 62 L 50 78 L 62 62 Z" fill="#e2e8f0" />
        <path d="M48 62 L 50 72 L 52 62 Z" fill="#ef4444" /> {/* Tie/Accent */}

        {/* Robot Arm Shoulders */}
        <circle cx="20" cy="80" r="10" fill="url(#metalHead)" />
        <circle cx="80" cy="80" r="10" fill="url(#metalHead)" />

        {/* Tech Lines on Jacket */}
        <line x1="30" y1="80" x2="30" y2="100" stroke="#334155" strokeWidth="2" />
        <line x1="70" y1="80" x2="70" y2="100" stroke="#334155" strokeWidth="2" />

        {/* --- Priyant Shah Name Badge --- */}
        <rect x="30" y="80" width="40" height="10" rx="3" fill="#0ea5e9" className="robot-badge" />
        <text
          x="50"
          y="87.5"
          fontFamily="'Outfit', sans-serif"
          fontSize="6.5"
          fontWeight="800"
          fill="#ffffff"
          textAnchor="middle"
          letterSpacing="0.05em"
        >
          PRIYANT SHAH
        </text>

        {/* Smart Scanning Line on Visor */}
        <rect x="33" y="35" width="34" height="2" fill="#a5f3fc" opacity="0.3" className="scanner-line" />
      </svg>
    </div>
  );
};

export default RobotAvatar;
