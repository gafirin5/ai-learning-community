import { CardSkeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="container-app py-10">
      <div className="mb-8 space-y-3">
        <div className="skeleton h-8 w-56" />
        <div className="skeleton h-4 w-80" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
