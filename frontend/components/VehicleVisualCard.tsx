'use client';

import { CSSProperties, useEffect, useMemo, useState } from 'react';
import { Car } from 'lucide-react';
import { VehicleDetails } from '@/lib/api';
import {
  getVehicleVisualProfile,
  VehicleBodyType,
  VehicleVisualProfile,
} from '@/lib/vehicleVisualProfile';

interface VehicleVisualCardProps {
  vehicle: VehicleDetails;
}

function Silhouette({ profile }: { profile: VehicleVisualProfile }) {
  const commonProps = {
    fill: 'url(#vehicleBody)',
    stroke: 'var(--visual-accent)',
    strokeOpacity: 0.36,
    strokeWidth: 5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  const paths: Record<VehicleBodyType, string> = {
    sedan:
      'M92 280c22-58 83-92 165-96h134c69 0 129 34 172 86l56 12c38 9 62 38 64 73H62c3-37 28-66 66-75h-36Z',
    hatchback:
      'M92 284c18-56 71-92 146-101h118c72 0 126 42 154 98l105 8c42 4 68 29 71 66H62c3-35 27-62 65-71H92Z',
    SUV: 'M82 286c21-70 78-116 155-126h207c75 0 130 43 164 124l42 10c31 8 50 29 53 61H60c3-33 25-58 59-69H82Z',
    coupe:
      'M89 293c29-61 98-104 188-112h82c87 0 151 36 194 101l66 11c37 7 61 30 64 62H63c4-30 26-53 62-62H89Z',
    estate:
      'M82 284c22-60 80-98 161-105h198c72 0 128 39 162 101l49 12c31 8 49 30 52 63H61c4-34 27-60 64-71H82Z',
    van: 'M79 287c12-82 61-132 141-137h284c55 0 95 44 112 131l47 13c27 8 44 29 47 61H61c3-33 23-58 56-68H79Z',
  };

  const windowPaths: Record<VehicleBodyType, string[]> = {
    sedan: ['M236 202c-38 9-70 33-94 67h166v-67h-72Z', 'M333 202h61c43 0 79 22 110 67H333v-67Z'],
    hatchback: [
      'M225 202c-34 10-61 32-80 66h149v-66h-69Z',
      'M319 202h39c44 0 78 23 101 66H319v-66Z',
    ],
    SUV: ['M222 181c-35 10-62 41-78 86h165v-86h-87Z', 'M337 181h93c48 0 86 31 112 86H337v-86Z'],
    coupe: ['M260 199c-44 11-79 34-106 69h169v-69h-63Z', 'M348 199h25c54 0 97 22 134 69H348v-69Z'],
    estate: ['M232 198c-39 9-69 33-90 69h162v-69h-72Z', 'M331 198h105c44 0 81 24 110 69H331v-69Z'],
    van: ['M208 173h130v97H153c11-54 29-85 55-97Z', 'M367 173h125c35 0 59 32 74 97H367v-97Z'],
  };

  return (
    <svg
      className="relative z-10 h-full w-full drop-shadow-2xl transition-transform duration-700 group-hover:scale-[1.03]"
      viewBox="0 0 760 430"
      role="img"
      aria-label={`${profile.bodyType} representative silhouette`}
    >
      <defs>
        <linearGradient id="vehicleBody" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="var(--visual-highlight)" stopOpacity="0.96" />
          <stop offset="0.42" stopColor="var(--visual-base)" stopOpacity="0.9" />
          <stop offset="1" stopColor="#020617" stopOpacity="0.98" />
        </linearGradient>
        <linearGradient id="windowGlass" x1="0" x2="1">
          <stop offset="0" stopColor="#f8fafc" stopOpacity="0.28" />
          <stop offset="1" stopColor="#38bdf8" stopOpacity="0.1" />
        </linearGradient>
        <radialGradient id="wheelShine">
          <stop offset="0" stopColor="#94a3b8" stopOpacity="0.9" />
          <stop offset="0.5" stopColor="#1e293b" stopOpacity="1" />
          <stop offset="1" stopColor="#020617" stopOpacity="1" />
        </radialGradient>
      </defs>

      <ellipse cx="382" cy="366" rx="300" ry="34" fill="#020617" opacity="0.4" />
      <path d={paths[profile.bodyType]} {...commonProps} />
      {windowPaths[profile.bodyType].map((path) => (
        <path key={path} d={path} fill="url(#windowGlass)" stroke="#e0f2fe" strokeOpacity="0.1" />
      ))}
      <path d="M120 312h522" stroke="#f8fafc" strokeOpacity="0.12" strokeWidth="4" />
      <circle cx="210" cy="354" r="49" fill="#020617" stroke="#64748b" strokeWidth="12" />
      <circle cx="210" cy="354" r="21" fill="url(#wheelShine)" />
      <circle cx="568" cy="354" r="49" fill="#020617" stroke="#64748b" strokeWidth="12" />
      <circle cx="568" cy="354" r="21" fill="url(#wheelShine)" />
    </svg>
  );
}

export default function VehicleVisualCard({ vehicle }: VehicleVisualCardProps) {
  const [isReady, setIsReady] = useState(false);
  const profile = useMemo(() => getVehicleVisualProfile(vehicle), [vehicle]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsReady(true));
    return () => cancelAnimationFrame(frame);
  }, [profile.bodyType, profile.theme.name]);

  return (
    <div
      className={`group relative min-h-[420px] overflow-hidden rounded-2xl border border-white/10 bg-slate-950 p-6 shadow-2xl transition-all duration-700 lg:col-span-2 ${
        isReady ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
      }`}
      style={
        {
          '--visual-base': profile.theme.base,
          '--visual-accent': profile.theme.accent,
          '--visual-glow': profile.theme.glow,
          '--visual-surface': profile.theme.surface,
          '--visual-highlight': profile.theme.highlight,
          '--visual-text': profile.theme.text,
        } as CSSProperties
      }
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,var(--visual-glow),transparent_34%),linear-gradient(135deg,#020617_0%,var(--visual-surface)_48%,#020617_100%)]" />
      <div className="vehicle-visual-sheen absolute inset-x-[-30%] top-0 h-40 rotate-[-12deg] bg-white/10 blur-2xl" />
      <div className="absolute bottom-20 left-1/2 h-28 w-3/4 -translate-x-1/2 rounded-full bg-[var(--visual-glow)] blur-3xl" />

      {!isReady && (
        <div className="absolute inset-0 z-20 animate-pulse bg-slate-900/60 backdrop-blur-sm" />
      )}

      <div className="relative z-10 flex h-full min-h-[368px] flex-col">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
            Visual identity
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-xl font-black text-white shadow-lg shadow-black/20">
              {profile.manufacturer.initials}
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-300">
                {profile.manufacturer.logoText}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-200">Manufacturer identity</p>
            </div>
          </div>
        </div>

        <div className="relative my-6 min-h-[250px] flex-1">
          <Silhouette profile={profile} />
        </div>

        <div className="mt-auto grid gap-2">
          <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-cyan-400/25 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-100">
            <Car className="h-4 w-4" />
            {profile.bodyType} silhouette
          </div>
          <p className="rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-xs leading-relaxed text-slate-300">
            Representative visual only.
          </p>
        </div>
      </div>
    </div>
  );
}
