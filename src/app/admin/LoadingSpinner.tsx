"use client";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

export default function LoadingSpinner({ 
  size = "md", 
  className = "",
  text
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex items-center gap-3">
        <svg
          className={`animate-spin ${sizeClasses[size]} text-indigo-500`}
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        {text && (
          <span className="text-sm text-zinc-400">{text}</span>
        )}
      </div>
    </div>
  );
}

// 全屏加载遮罩
export function LoadingOverlay({ text = "加载中..." }: { text?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="rounded-lg bg-zinc-900 p-6 shadow-xl ring-1 ring-zinc-700">
        <LoadingSpinner size="lg" text={text} />
      </div>
    </div>
  );
}

// 页面级加载状态
export function PageLoading({ text = "正在加载页面..." }: { text?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mb-4" />
        <p className="text-zinc-400">{text}</p>
      </div>
    </div>
  );
}
