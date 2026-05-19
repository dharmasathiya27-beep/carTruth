'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Zap } from 'lucide-react';

export default function SearchBox() {
  const [registration, setRegistration] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!registration.trim()) {
      setError('Please enter a registration number');
      return;
    }

    setLoading(true);
    try {
      // Navigate to report page - the page will handle the API call
      router.push(`/report/${encodeURIComponent(registration)}`);
    } catch (err: any) {
      setError(err.message || 'Failed to search');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl blur-xl opacity-75" />

        {/* Main input container */}
        <div className="relative bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center gap-4">
            <Search className="w-6 h-6 text-blue-400 flex-shrink-0" />
            <input
              type="text"
              value={registration}
              onChange={(e) => setRegistration(e.target.value.toUpperCase())}
              placeholder="Enter registration (e.g., AB20OXY)"
              maxLength={7}
              disabled={loading}
              className="flex-1 bg-transparent text-lg font-semibold text-white placeholder-slate-400 focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">{loading ? 'Searching...' : 'Check'}</span>
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Helper text */}
          <p className="text-xs text-slate-400 mt-4">
            Try these examples: AB20OXY, YM70EUH, GX15EWS, MK22XYZ
          </p>
        </div>
      </div>
    </form>
  );
}
