import { TableSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div>
      <div className="mb-6 space-y-2">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-4 w-24" />
      </div>
      <TableSkeleton rows={8} />
    </div>
  );
}
