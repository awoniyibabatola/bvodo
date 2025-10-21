'use client';

interface FancyLoaderProps {
  message?: string;
  fullScreen?: boolean;
}

export default function FancyLoader({ message = 'Loading...', fullScreen = false }: FancyLoaderProps) {
  const containerClasses = fullScreen
    ? 'fixed inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center z-50'
    : 'flex items-center justify-center py-20';

  return (
    <div className={containerClasses}>
      <div className="text-center">
        {/* Animated Hotel Building */}
        <div className="relative w-48 h-48 mx-auto mb-8">
          {/* Building Base - Foundation */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-3 bg-gray-400 rounded-sm"></div>

          {/* Floor 1 - Ground Floor */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-28 h-10 bg-gradient-to-br from-blue-400 to-blue-500 rounded-t-sm animate-[slideUp_0.6s_ease-out_0.1s_both] shadow-lg">
            <div className="flex justify-around items-center h-full px-2">
              <div className="w-3 h-4 bg-yellow-300 rounded-sm animate-pulse"></div>
              <div className="w-3 h-4 bg-yellow-300 rounded-sm animate-pulse [animation-delay:0.2s]"></div>
              <div className="w-3 h-4 bg-yellow-300 rounded-sm animate-pulse [animation-delay:0.4s]"></div>
            </div>
          </div>

          {/* Floor 2 */}
          <div className="absolute bottom-13 left-1/2 -translate-x-1/2 w-28 h-10 bg-gradient-to-br from-purple-400 to-purple-500 animate-[slideUp_0.6s_ease-out_0.3s_both] shadow-lg">
            <div className="flex justify-around items-center h-full px-2">
              <div className="w-3 h-4 bg-yellow-200 rounded-sm animate-pulse [animation-delay:0.3s]"></div>
              <div className="w-3 h-4 bg-yellow-200 rounded-sm animate-pulse [animation-delay:0.5s]"></div>
              <div className="w-3 h-4 bg-yellow-200 rounded-sm animate-pulse [animation-delay:0.7s]"></div>
            </div>
          </div>

          {/* Floor 3 */}
          <div className="absolute bottom-23 left-1/2 -translate-x-1/2 w-28 h-10 bg-gradient-to-br from-indigo-400 to-indigo-500 animate-[slideUp_0.6s_ease-out_0.5s_both] shadow-lg">
            <div className="flex justify-around items-center h-full px-2">
              <div className="w-3 h-4 bg-yellow-100 rounded-sm animate-pulse [animation-delay:0.4s]"></div>
              <div className="w-3 h-4 bg-yellow-100 rounded-sm animate-pulse [animation-delay:0.6s]"></div>
              <div className="w-3 h-4 bg-yellow-100 rounded-sm animate-pulse [animation-delay:0.8s]"></div>
            </div>
          </div>

          {/* Roof/Penthouse */}
          <div className="absolute bottom-33 left-1/2 -translate-x-1/2 w-28 h-8 bg-gradient-to-br from-pink-400 to-pink-500 rounded-t-lg animate-[slideUp_0.6s_ease-out_0.7s_both] shadow-xl">
            <div className="flex justify-center items-center h-full">
              <svg className="w-5 h-5 text-yellow-300 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 2.18l8 3.6v8.73c0 4.37-3.02 8.44-7.5 9.49-4.48-1.05-7.5-5.12-7.5-9.49V7.78l7-3.15V14h2V4.18z"/>
              </svg>
            </div>
          </div>

          {/* Decorative Stars/Sparkles */}
          <div className="absolute top-0 left-0 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
          <div className="absolute top-2 right-4 w-2 h-2 bg-blue-400 rounded-full animate-ping [animation-delay:0.3s]"></div>
          <div className="absolute top-8 right-0 w-2 h-2 bg-purple-400 rounded-full animate-ping [animation-delay:0.6s]"></div>
        </div>

        {/* Loading text with gradient */}
        <div className="space-y-2">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-pulse">
            {message}
          </h3>

          {/* Loading dots */}
          <div className="flex justify-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce [animation-delay:0ms]"></div>
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce [animation-delay:150ms]"></div>
            <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce [animation-delay:300ms]"></div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-8 w-64 mx-auto h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full animate-[progress_2s_ease-in-out_infinite]"></div>
        </div>
      </div>
    </div>
  );
}
