interface LoadingStateProps {
  type?: 'card' | 'chart' | 'table';
  count?: number;
}

function SkeletonCard() {
  return (
    <div className="glass-card p-5 space-y-3">
      <div className="skeleton h-4 w-24" />
      <div className="skeleton h-8 w-16" />
      <div className="skeleton h-3 w-32" />
      <div className="skeleton h-12 w-full" />
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="skeleton h-5 w-40" />
        <div className="skeleton h-8 w-28" />
      </div>
      <div className="skeleton h-64 w-full" />
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="glass-card p-5 space-y-3">
      <div className="skeleton h-5 w-48" />
      <div className="skeleton h-10 w-full" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="skeleton h-8 w-full" />
      ))}
    </div>
  );
}

export default function LoadingState({ type = 'card', count = 1 }: LoadingStateProps) {
  const Component = type === 'chart' ? SkeletonChart : type === 'table' ? SkeletonTable : SkeletonCard;
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Component key={i} />
      ))}
    </>
  );
}
