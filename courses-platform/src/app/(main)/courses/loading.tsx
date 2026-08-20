import { CourseGridSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="container-app py-10">
      <div className="mb-8 space-y-2">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-4 w-64" />
      </div>
      <div className="skeleton mb-8 h-32 w-full" />
      <CourseGridSkeleton count={9} />
    </div>
  );
}
