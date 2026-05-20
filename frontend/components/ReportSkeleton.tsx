import Header from '@/components/Header';

function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/10 ${className}`} />;
}

export default function ReportSkeleton() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-950 px-4 py-12">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="grid items-stretch gap-6 lg:grid-cols-5">
            <div className="glass rounded-2xl p-8 lg:col-span-3">
              <div className="mb-8 flex gap-3">
                <SkeletonBlock className="h-10 w-28" />
                <SkeletonBlock className="h-10 w-36" />
                <SkeletonBlock className="h-10 w-32" />
              </div>
              <SkeletonBlock className="mb-4 h-12 w-3/4" />
              <SkeletonBlock className="mb-8 h-6 w-1/2" />
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <SkeletonBlock className="h-28" />
                <SkeletonBlock className="h-28" />
                <SkeletonBlock className="h-28" />
                <SkeletonBlock className="h-28" />
              </div>
            </div>
            <SkeletonBlock className="min-h-[300px] rounded-2xl lg:col-span-2" />
          </div>

          <div className="glass rounded-2xl p-8">
            <div className="grid gap-8 md:grid-cols-2">
              <SkeletonBlock className="mx-auto h-56 w-56 rounded-full" />
              <div className="space-y-4">
                <SkeletonBlock className="h-10 w-64" />
                <SkeletonBlock className="h-20" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <SkeletonBlock className="h-24" />
                  <SkeletonBlock className="h-24" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <SkeletonBlock className="h-44" />
            <SkeletonBlock className="h-44" />
            <SkeletonBlock className="h-44" />
          </div>
        </div>
      </main>
    </>
  );
}
