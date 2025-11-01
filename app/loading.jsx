export default function Loading() {
  // You can add any UI inside Loading, including a Skeleton.
  return (
    <div className="w-full min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="animate-pulse space-y-8">
        {/* Header Skeleton */}
        <div className="h-16 bg-gray-200 rounded-md w-full"></div>

        {/* Main Content Skeleton */}
        <div className="space-y-6">
          <div className="h-10 bg-gray-200 rounded-md w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="h-40 bg-gray-200 rounded-lg"></div>
            <div className="h-40 bg-gray-200 rounded-lg"></div>
            <div className="h-40 bg-gray-200 rounded-lg"></div>
            <div className="h-40 bg-gray-200 rounded-lg md:col-span-2"></div>
            <div className="h-40 bg-gray-200 rounded-lg"></div>
            <div className="h-40 bg-gray-200 rounded-lg"></div>
            <div className="h-40 bg-gray-200 rounded-lg"></div>
            <div className="h-40 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
