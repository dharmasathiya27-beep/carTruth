'use client';

import { BadgeCheck, CalendarDays, Car, Fuel, Gauge, Palette, ShieldCheck } from 'lucide-react';
import { VehicleDetails } from '@/lib/api';

interface VehicleIdentityCardProps {
  vehicle: VehicleDetails;
  motStatus: string;
  dataSource: string;
}

function detailValue(value?: string | number | null) {
  if (value === undefined || value === null || value === '') return 'N/A';
  return value;
}

export default function VehicleIdentityCard({
  vehicle,
  motStatus,
  dataSource,
}: VehicleIdentityCardProps) {
  const engine = vehicle.engine_capacity_cc
    ? `${vehicle.engine_capacity_cc.toLocaleString()} cc`
    : vehicle.engine_size
      ? `${vehicle.engine_size}L`
      : 'N/A';

  const details = [
    {
      label: 'Fuel',
      value: detailValue(vehicle.fuel_type),
      icon: Fuel,
    },
    {
      label: 'Engine',
      value: engine,
      icon: Gauge,
    },
    {
      label: 'Colour',
      value: detailValue(vehicle.colour),
      icon: Palette,
    },
    {
      label: 'Tax',
      value: detailValue(vehicle.tax_status),
      icon: ShieldCheck,
    },
    {
      label: 'MOT',
      value: detailValue(motStatus),
      icon: CalendarDays,
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900 p-8 lg:col-span-2 min-h-[300px]">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#0f172a_0%,#111827_50%,#164e63_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(34,211,238,0.22),transparent_34%)]" />
      <div className="absolute -right-16 bottom-8 h-40 w-72 rounded-t-full border-x-4 border-t-4 border-cyan-300/15" />
      <div className="absolute -right-10 bottom-5 h-8 w-64 rounded-full bg-slate-700/25" />
      <div className="absolute right-40 bottom-0 h-14 w-14 rounded-full border-4 border-slate-500/35 bg-slate-950/70" />
      <div className="absolute right-4 bottom-0 h-14 w-14 rounded-full border-4 border-slate-500/35 bg-slate-950/70" />

      <div className="relative z-10 flex h-full min-h-[244px] flex-col justify-between">
        <div>
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-2xl font-bold tracking-widest text-white">
              {vehicle.registration || 'N/A'}
            </span>
            <span className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-3 py-2 text-sm font-semibold text-emerald-200">
              <BadgeCheck className="h-4 w-4" />
              {dataSource === 'dvla' ? 'DVLA verified' : 'Fallback data'}
            </span>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10">
              <Car className="h-7 w-7 text-cyan-200" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/75">
                Vehicle identity
              </p>
              <h2 className="mt-2 text-3xl font-bold text-white">
                {vehicle.make || 'Unknown Make'} {vehicle.model || ''}
              </h2>
              <p className="mt-1 text-sm text-slate-300">
                {vehicle.year || 'Year unavailable'}
                {vehicle.year && vehicle.month_of_first_registration
                  ? ` • First registered ${vehicle.month_of_first_registration}`
                  : ''}
              </p>
            </div>
          </div>
        </div>

        <div>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {details.map((detail) => {
              const Icon = detail.icon;
              return (
                <div
                  key={detail.label}
                  className="rounded-xl border border-white/10 bg-slate-950/35 p-3"
                >
                  <div className="mb-1 flex items-center gap-2 text-xs text-slate-400">
                    <Icon className="h-3.5 w-3.5" />
                    {detail.label}
                  </div>
                  <p className="text-sm font-semibold text-white">{detail.value}</p>
                </div>
              );
            })}
          </div>

          <p className="mt-4 rounded-lg border border-white/10 bg-slate-950/35 px-3 py-2 text-xs text-slate-400">
            Vehicle image not shown to avoid inaccurate representation.
          </p>
        </div>
      </div>
    </div>
  );
}
