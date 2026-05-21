'use client';

import { CalendarDays, Car, Fuel, Gauge, Milestone, Palette, ShieldCheck } from 'lucide-react';
import { VehicleReport } from '@/lib/api';
import VehicleVisualCard from '@/components/VehicleVisualCard';
import { getVehicleVisualProfile } from '@/lib/vehicleVisualProfile';

interface VehicleHeroSectionProps {
  report: VehicleReport;
}

export default function VehicleHeroSection({ report }: VehicleHeroSectionProps) {
  const vehicle = report.vehicle;
  const age = vehicle.year ? new Date().getFullYear() - vehicle.year : null;
  const motValidUntil = report.mot_valid_until
    ? new Date(report.mot_valid_until).toLocaleDateString('en-GB')
    : null;
  const latestMileage = [...(report.mileage_history || [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )[0];
  const visualProfile = getVehicleVisualProfile(vehicle);
  const engine = vehicle.engine_capacity_cc
    ? `${vehicle.engine_capacity_cc.toLocaleString()} cc`
    : vehicle.engine_size
      ? `${vehicle.engine_size}L`
      : 'N/A';

  const detailCards = [
    {
      label: 'Body',
      value: visualProfile.bodyType,
      icon: Car,
    },
    {
      label: 'Colour',
      value: vehicle.colour || visualProfile.theme.name,
      icon: Palette,
    },
    {
      label: 'Fuel',
      value: vehicle.fuel_type || 'N/A',
      icon: Fuel,
    },
    {
      label: 'Engine',
      value: engine,
      icon: Gauge,
    },
    {
      label: 'MOT',
      value: report.current_mot_status || 'Unknown',
      detail: motValidUntil ? `Valid until: ${motValidUntil}` : undefined,
      icon: CalendarDays,
    },
    {
      label: 'Mileage',
      value: latestMileage ? `${latestMileage.mileage.toLocaleString()} miles` : 'N/A',
      detail: latestMileage
        ? `Last updated: ${new Date(latestMileage.date).toLocaleDateString('en-GB')}`
        : undefined,
      icon: Milestone,
    },
    {
      label: 'Tax',
      value: vehicle.tax_status || 'N/A',
      detail: vehicle.tax_due_date
        ? `Due: ${new Date(vehicle.tax_due_date).toLocaleDateString('en-GB')}`
        : undefined,
      icon: ShieldCheck,
    },
  ];

  return (
    <section className="mb-12">
      <div className="grid lg:grid-cols-5 gap-6 items-stretch">
        <div className="glass rounded-2xl p-8 lg:col-span-3">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="px-4 py-2 rounded-lg border border-white/15 bg-white/10 text-xl font-bold tracking-wider">
              {vehicle.registration || 'N/A'}
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-500/30 bg-emerald-500/15 text-sm font-semibold text-emerald-300">
              <ShieldCheck className="w-4 h-4" />
              {report.data_source === 'dvla' ? 'DVLA verified' : 'Mock data'}
            </span>
            <span className="px-3 py-2 rounded-lg border border-blue-500/30 bg-blue-500/15 text-sm font-semibold text-blue-300">
              {report.confidence_level} confidence
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {vehicle.make || 'Unknown Make'} {vehicle.model || ''}
          </h1>
          <p className="text-lg text-slate-400 mb-8">
            {vehicle.year || 'Year unavailable'}
            {age !== null ? ` • ${age} years old` : ''} • {vehicle.colour || 'Colour unavailable'}
          </p>

          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {detailCards.map((detail) => {
              const Icon = detail.icon;

              return (
                <div
                  key={detail.label}
                  className="rounded-xl border border-white/10 bg-slate-900/50 p-4"
                >
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                    <Icon className="w-4 h-4" />
                    {detail.label}
                  </div>
                  <p className="text-xl font-bold capitalize">{detail.value}</p>
                  {detail.detail && (
                    <p className="mt-1 text-xs font-medium text-slate-400">{detail.detail}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <VehicleVisualCard vehicle={vehicle} />
      </div>
    </section>
  );
}
