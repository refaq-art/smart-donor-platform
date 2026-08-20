export function CourseCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton h-40 w-full rounded-none" />
      <div className="flex flex-col gap-3 p-4">
        <div className="skeleton h-3 w-20" />
        <div className="skeleton h-5 w-full" />
        <div className="skeleton h-4 w-4/5" />
        <div className="flex gap-1.5">
          <div className="skeleton h-6 w-16" />
          <div className="skeleton h-6 w-16" />
        </div>
        <div className="skeleton h-4 w-full" />
      </div>
    </div>
  );
}

export function CourseGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <CourseCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton h-11 w-full rounded-none" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-t border-slate-100 px-4 py-3">
          <div className="skeleton h-4 w-1/4" />
          <div className="skeleton h-4 w-1/4" />
          <div className="skeleton h-4 w-1/5" />
          <div className="skeleton h-4 w-1/6" />
        </div>
      ))}
    </div>
  );
}
