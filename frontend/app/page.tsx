'use client';

import Header from '@/components/Header';
import SearchBox from '@/components/SearchBox';
import { ArrowRight, Shield, TrendingUp, AlertTriangle } from 'lucide-react';

export default function Home() {
  return (
    <>
      <Header />

      <main className="min-h-screen bg-slate-950">
        {/* Hero Section */}
        <section className="relative px-4 py-20 md:py-32">
          {/* Animated background */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl" />
          </div>

          <div className="max-w-6xl mx-auto">
            {/* Main heading */}
            <div className="text-center mb-12">
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
                Know the Truth About
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Any Car
                </span>
              </h1>
              <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">
                Enter a UK registration number and get an AI-powered report revealing the
                vehicle&apos;s history, condition, and ownership score in seconds.
              </p>
            </div>

            {/* Search box */}
            <div className="mb-20">
              <SearchBox />
            </div>

            {/* Feature cards */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="glass rounded-2xl p-8 group hover:bg-white/15 transition-all duration-300">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-500/30 transition-colors">
                  <Shield className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Complete History</h3>
                <p className="text-slate-400">
                  MOT records, mileage history, tax status, and more from official UK databases.
                </p>
              </div>

              <div className="glass rounded-2xl p-8 group hover:bg-white/15 transition-all duration-300">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-500/30 transition-colors">
                  <TrendingUp className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">AI Insights</h3>
                <p className="text-slate-400">
                  Smart analysis of patterns, risk areas, and expected maintenance costs.
                </p>
              </div>

              <div className="glass rounded-2xl p-8 group hover:bg-white/15 transition-all duration-300">
                <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-pink-500/30 transition-colors">
                  <AlertTriangle className="w-6 h-6 text-pink-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Buy/Own Score</h3>
                <p className="text-slate-400">
                  Clear ownership score out of 100 with a plain English recommendation.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="px-4 py-20 border-t border-white/10">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-16">How It Works</h2>

            <div className="grid md:grid-cols-4 gap-8">
              {[
                { step: '1', title: 'Enter Registration', desc: 'Input the UK number plate' },
                { step: '2', title: 'Instant Analysis', desc: 'AI analyzes the vehicle data' },
                { step: '3', title: 'Get Report', desc: 'Premium report generated' },
                { step: '4', title: 'Make Decision', desc: 'Buy with confidence' },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-white">{item.step}</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-slate-400 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-4 py-20">
          <div className="max-w-4xl mx-auto text-center glass rounded-3xl p-12">
            <h2 className="text-3xl font-bold mb-6">Ready to check a car?</h2>
            <p className="text-lg text-slate-300 mb-8">
              Use these example registrations to see CarTruth in action:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['AB20OXY', 'YM70EUH', 'GX15EWS', 'MK22XYZ'].map((reg) => (
                <button
                  key={reg}
                  onClick={() => {
                    // This will be handled by SearchBox component
                    const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                    if (input) {
                      input.value = reg;
                      input.form?.dispatchEvent(new Event('submit', { bubbles: true }));
                    }
                  }}
                  className="px-4 py-3 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 rounded-lg text-blue-300 font-semibold transition-all"
                >
                  {reg}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-4 py-8 border-t border-white/10 text-center text-slate-500 text-sm">
          <p>
            CarTruth MVP • Built with Next.js & FastAPI • DVLA vehicle data with mock MOT history
          </p>
        </footer>
      </main>
    </>
  );
}
