'use client';

import { VehicleSpecificationData } from '@/lib/api';

interface VehicleSpecificationPreviewProps {
  specs?: VehicleSpecificationData | null;
}

const specLabels: Array<{ key: keyof VehicleSpecificationData; label: string }> = [
  { key: 'fuel_economy', label: 'Fuel economy' },
  { key: 'performance', label: 'Performance' },
  { key: 'dimensions', label: 'Dimensions' },
  { key: 'weight', label: 'Weight' },
  { key: 'safety_rating', label: 'Safety rating' },
  { key: 'insurance_group', label: 'Insurance group' },
  { key: 'road_tax_band', label: 'Road tax band' },
];

export default function VehicleSpecificationPreview({ specs }: VehicleSpecificationPreviewProps) {
  const availableSpecs = specLabels
    .map((item) => ({ ...item, value: specs?.[item.key] }))
    .filter((item) => item.value && String(item.value).trim());

  if (availableSpecs.length === 0) {
    if (process.env.NODE_ENV !== 'development') {
      return null;
    }

    return (
      <section className="mb-12 rounded-2xl border border-dashed border-white/10 bg-slate-900/30 p-5">
        <p className="text-sm text-slate-500">Spec data coming soon</p>
      </section>
    );
  }

  return (
    <section className="mb-12 glass rounded-2xl p-6">
      <h2 className="mb-5 text-2xl font-semibold text-white">Vehicle Specification Preview</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {availableSpecs.map((spec) => (
          <div key={spec.key} className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
            <p className="mb-1 text-xs text-slate-400">{spec.label}</p>
            <p className="text-base font-semibold text-white">{spec.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
