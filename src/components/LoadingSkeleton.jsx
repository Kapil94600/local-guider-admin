export const LoadingSkeleton = ({ rows = 5, cols = 5 }) => (
  <div className="animate-pulse">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4 p-2 border-b">
        {Array.from({ length: cols }).map((_, j) => (
          <div key={j} className="h-6 bg-gray-200 rounded flex-1"></div>
        ))}
      </div>
    ))}
  </div>
);