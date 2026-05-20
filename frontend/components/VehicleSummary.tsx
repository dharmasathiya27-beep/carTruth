'use client';

import { Fuel, Zap, CalendarDays, Cloud } from 'lucide-react';
import { VehicleDetails } from '@/lib/api';

interface VehicleSummaryProps {
  vehicle: VehicleDetails;
  motStatus: string;
  motValidUntil?: string;
}

export default function VehicleSummary({ vehicle, motStatus, motValidUntil }: VehicleSummaryProps) {
  const getMotStatusColor = () => {
    if (motStatus === 'Valid') return 'bg-green-500/20 text-green-300 border-green-500/30';
    if (motStatus === 'Due Soon') return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    return 'bg-red-500/20 text-red-300 border-red-500/30';
  };

  const formatMonth = (value?: string) => {
    if (!value) return 'N/A';
    const date = new Date(`${value}-01`);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  };
  const vehicleAge = vehicle.year ? new Date().getFullYear() - vehicle.year : null;

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-white mb-1">Vehicle Details</h2>
            <p className="text-sm text-slate-400">
              Registration, tax, emissions, and manufacturing data.
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-400">{vehicle.year || 'N/A'}</div>
            <p className="text-sm text-slate-400">
              {vehicleAge !== null ? `${vehicleAge} years old` : 'Age unavailable'}
            </p>
          </div>
        </div>

        {/* Quick details grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/40 rounded-lg p-4">
            <p className="text-xs text-slate-400 mb-1">Fuel Type</p>
            <p className="text-lg font-semibold flex items-center gap-2">
              <Fuel className="w-4 h-4 text-blue-400" />
              {vehicle.fuel_type || 'N/A'}
            </p>
          </div>

          <div className="bg-slate-800/40 rounded-lg p-4">
            <p className="text-xs text-slate-400 mb-1">Engine</p>
            <p className="text-lg font-semibold flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-400" />
              {vehicle.engine_capacity_cc
                ? `${vehicle.engine_capacity_cc} cc`
                : vehicle.engine_size
                  ? `${vehicle.engine_size}L`
                  : 'N/A'}
            </p>
          </div>

          <div className="bg-slate-800/40 rounded-lg p-4">
            <p className="text-xs text-slate-400 mb-1">Colour</p>
            <p className="text-lg font-semibold">{vehicle.colour || 'N/A'}</p>
          </div>

          <div className="bg-slate-800/40 rounded-lg p-4">
            <p className="text-xs text-slate-400 mb-1">Tax Status</p>
            <p className="text-lg font-semibold text-green-400">{vehicle.tax_status || 'N/A'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-slate-800/40 rounded-lg p-4">
            <p className="text-xs text-slate-400 mb-1">Tax Due</p>
            <p className="text-lg font-semibold">
              {vehicle.tax_due_date
                ? new Date(vehicle.tax_due_date).toLocaleDateString('en-GB')
                : 'N/A'}
            </p>
          </div>

          <div className="bg-slate-800/40 rounded-lg p-4">
            <p className="text-xs text-slate-400 mb-1">CO2</p>
            <p className="text-lg font-semibold flex items-center gap-2">
              <Cloud className="w-4 h-4 text-blue-400" />
              {vehicle.co2_emissions !== undefined && vehicle.co2_emissions !== null
                ? `${vehicle.co2_emissions} g/km`
                : 'N/A'}
            </p>
          </div>

          <div className="bg-slate-800/40 rounded-lg p-4">
            <p className="text-xs text-slate-400 mb-1">First Registered</p>
            <p className="text-lg font-semibold">
              {formatMonth(vehicle.month_of_first_registration)}
            </p>
          </div>

          <div className="bg-slate-800/40 rounded-lg p-4">
            <p className="text-xs text-slate-400 mb-1">Wheelplan / Euro</p>
            <p className="text-lg font-semibold">
              {vehicle.wheelplan || 'N/A'}
              {vehicle.euro_status ? `, ${vehicle.euro_status}` : ''}
            </p>
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">MOT Status</h2>
          <span
            className={`px-4 py-2 rounded-lg border text-sm font-semibold ${getMotStatusColor()}`}
          >
            {motStatus}
          </span>
        </div>

        {motValidUntil && (
          <div className="flex items-center gap-2 text-slate-300">
            <CalendarDays className="w-4 h-4" />
            <span>Valid until: {new Date(motValidUntil).toLocaleDateString('en-GB')}</span>
          </div>
        )}
      </div>
    </div>
  );
}
