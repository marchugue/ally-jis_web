import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Matches Skeleton */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 flex items-center gap-4 border border-[#1A6B3C]/6">
                <Skeleton className="w-14 h-14 rounded-2xl flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-8 w-20 rounded-full" />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Skeleton className="h-5 w-16 rounded-lg" />
                    <Skeleton className="h-5 w-16 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Skeleton */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-[#1A6B3C]/6">
            <Skeleton className="h-5 w-32 mb-3" />
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-6 w-16 rounded-lg" />
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-[#1A6B3C]/6">
            <Skeleton className="h-5 w-32 mb-3" />
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
