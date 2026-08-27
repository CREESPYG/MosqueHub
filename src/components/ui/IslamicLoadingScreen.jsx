import React from "react";

export default function IslamicLoadingScreen({ message = "Loading prayer timings & events..." }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-950 text-white select-none overflow-hidden px-4">
      {/* Background Ambient Glows */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: "1s" }} />

      {/* Center Islamic Emblem Container */}
      <div className="relative flex items-center justify-center mb-6">
        {/* Outer Orbiting Light Ring */}
        <div className="absolute w-32 h-32 rounded-full border-2 border-dashed border-emerald-400/40 animate-spin" style={{ animationDuration: "8s" }} />
        
        {/* Pulsing Ambient Glow */}
        <div className="absolute w-28 h-28 rounded-full bg-emerald-500/25 blur-xl animate-pulse" />

        {/* Center Glass Card with Mosque Icon */}
        <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-tr from-emerald-800/80 to-emerald-600/80 border border-emerald-400/40 backdrop-blur-md shadow-2xl flex items-center justify-center shadow-emerald-950/60 transform transition-transform hover:scale-105">
          <svg
            className="w-12 h-12 text-amber-300 drop-shadow-[0_2px_12px_rgba(251,191,36,0.5)]"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            {/* Mosque & Crescent SVG Icon */}
            <path d="M12 2a1 1 0 0 1 1 1v1.07c2.8.34 5 2.61 5 5.43v.5h1a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-10a1 1 0 0 1 1-1h1v-.5c0-2.82 2.2-5.09 5-5.43V3a1 1 0 0 1 1-1zm0 4.5c-1.93 0-3.5 1.57-3.5 3.5v.5h7v-.5c0-1.93-1.57-3.5-3.5-3.5zm0 8.5a2.5 2.5 0 0 0-2.5 2.5v2.5h5v-2.5a2.5 2.5 0 0 0-2.5-2.5z" />
          </svg>
        </div>
      </div>

      {/* Arabic Calligraphy Header */}
      <div className="text-emerald-300/80 font-serif text-lg tracking-widest mb-1 select-none font-bold">
        بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
      </div>

      {/* App Title */}
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-100 to-amber-200 drop-shadow-sm mb-1 text-center">
        Mosque Hub
      </h1>

      {/* Mosque Subtitle */}
      <p className="text-xs sm:text-sm font-medium text-emerald-300/90 tracking-wider mb-6 uppercase">
        Masjid Al-Putki • Jharkhand
      </p>

      {/* Progress Bar Container */}
      <div className="w-56 sm:w-64 h-1.5 bg-emerald-950/80 border border-emerald-700/40 rounded-full overflow-hidden relative mb-4">
        <div 
          className="absolute inset-y-0 bg-gradient-to-r from-emerald-400 via-amber-300 to-emerald-400 rounded-full"
          style={{
            width: "40%",
            animation: "shimmerSlide 1.6s ease-in-out infinite alternate"
          }}
        />
      </div>

      {/* Dynamic Status Text */}
      <div className="flex items-center gap-2 text-xs text-emerald-200/70 font-medium">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
        <span>{message}</span>
      </div>

      {/* Inline styles for custom animations */}
      <style>{`
        @keyframes shimmerSlide {
          0% { left: 0%; width: 25%; }
          50% { width: 50%; }
          100% { left: 75%; width: 25%; }
        }
      `}</style>
    </div>
  );
}
