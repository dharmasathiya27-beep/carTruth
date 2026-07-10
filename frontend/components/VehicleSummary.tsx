'use client';

import { VehicleDetails } from '@/lib/api';

interface VehicleSummaryProps {
  vehicle: VehicleDetails;
  motStatus: string;
  motValidUntil?: string;
}

export default function VehicleSummary({ vehicle, motStatus, motValidUntil }: VehicleSummaryProps) {
  const notAvailable = 'Not available';

  const hasValue = (value?: string | number | null) =>
    value !== undefined && value !== null && String(value).trim() !== '';

  const formatValue = (value?: string | number | null) =>
    hasValue(value) ? String(value) : notAvailable;

  const formatDate = (value?: string) => {
    if (!value) return notAvailable;
    const date = new Date(`${value.slice(0, 10)}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatBoolean = (value?: boolean | null) => {
    if (value === true) return 'Yes';
    if (value === false) return 'No';
    return notAvailable;
  };

  const colour = vehicle.primary_colour || vehicle.colour;

  const facts = [
    { label: 'Fuel type', value: formatValue(vehicle.fuel_type) },
    {
      label: 'Engine capacity',
      value: vehicle.engine_capacity_cc
        ? `${vehicle.engine_capacity_cc.toLocaleString()} cc`
        : vehicle.engine_size
          ? `${vehicle.engine_size}L`
          : notAvailable,
    },
    { label: 'Colour', value: formatValue(colour) },
    { label: 'Tax status', value: formatValue(vehicle.tax_status) },
    {
      label: 'Tax due date',
      value: formatDate(vehicle.tax_due_date),
    },
    {
      label: 'MOT status',
      value: motStatus || 'Unknown',
      detail: motValidUntil ? `Expires: ${formatDate(motValidUntil)}` : undefined,
    },
    {
      label: 'CO₂ emissions',
      value:
        vehicle.co2_emissions !== undefined && vehicle.co2_emissions !== null
          ? `${vehicle.co2_emissions} g/km`
          : notAvailable,
    },
    { label: 'Last V5C issued', value: formatDate(vehicle.date_of_last_v5c_issued) },
    { label: 'Marked for export', value: formatBoolean(vehicle.marked_for_export) },
    { label: 'Type approval', value: formatValue(vehicle.type_approval) },
    { label: 'Wheelplan', value: formatValue(vehicle.wheelplan) },
    { label: 'Registration date', value: formatDate(vehicle.registration_date) },
    { label: 'Outstanding recall', value: formatValue(vehicle.has_outstanding_recall) },
    hasValue(vehicle.euro_status)
      ? { label: 'Euro status', value: formatValue(vehicle.euro_status) }
      : null,
  ].filter((fact): fact is { label: string; value: string; detail?: string } => Boolean(fact));

  const renderFacts = () =>
    facts.map((fact) => (
      <div key={fact.label} className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
        <p className="mb-1 text-xs text-slate-400">{fact.label}</p>
        <p className="text-base font-semibold text-white">{fact.value}</p>
        {fact.detail && <p className="mt-1 text-xs text-slate-500">{fact.detail}</p>}
      </div>
    ));

  return (
    <section className="glass rounded-2xl p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-white">Official Vehicle Facts</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{renderFacts()}</div>
    </section>
  );
}
