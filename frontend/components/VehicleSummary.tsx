'use client';

import { VehicleDetails } from '@/lib/api';

interface VehicleSummaryProps {
  vehicle: VehicleDetails;
  motStatus: string;
  motValidUntil?: string;
}

export default function VehicleSummary({ vehicle, motStatus, motValidUntil }: VehicleSummaryProps) {
  const formatMonth = (value?: string) => {
    if (!value) return 'N/A';
    const date = new Date(`${value}-01`);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  };

  const facts = [
    { label: 'Fuel Type', value: vehicle.fuel_type || 'N/A' },
    {
      label: 'Engine Capacity',
      value: vehicle.engine_capacity_cc
        ? `${vehicle.engine_capacity_cc.toLocaleString()} cc`
        : vehicle.engine_size
          ? `${vehicle.engine_size}L`
          : 'N/A',
    },
    { label: 'Colour', value: vehicle.colour || 'N/A' },
    { label: 'Tax Status', value: vehicle.tax_status || 'N/A' },
    {
      label: 'Tax Due Date',
      value: vehicle.tax_due_date
        ? new Date(vehicle.tax_due_date).toLocaleDateString('en-GB')
        : 'N/A',
    },
    {
      label: 'CO2 Emissions',
      value:
        vehicle.co2_emissions !== undefined && vehicle.co2_emissions !== null
          ? `${vehicle.co2_emissions} g/km`
          : 'N/A',
    },
    { label: 'First Registered', value: formatMonth(vehicle.month_of_first_registration) },
    {
      label: 'Wheelplan / Euro Status',
      value: `${vehicle.wheelplan || 'N/A'}${vehicle.euro_status ? `, ${vehicle.euro_status}` : ''}`,
    },
    {
      label: 'MOT Status',
      value: motStatus || 'Unknown',
      detail: motValidUntil
        ? `Expires: ${new Date(motValidUntil).toLocaleDateString('en-GB')}`
        : undefined,
    },
  ];

  return (
    <section className="glass rounded-2xl p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-white mb-1">Official DVLA Facts</h2>
        <p className="text-sm text-slate-400">
          Structured vehicle fields from official data where configured.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {facts.map((fact) => (
          <div key={fact.label} className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
            <p className="text-xs text-slate-400 mb-1">{fact.label}</p>
            <p className="text-base font-semibold text-white">{fact.value}</p>
            {fact.detail && <p className="mt-1 text-xs text-slate-500">{fact.detail}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
