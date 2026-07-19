import { useEffect } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'

export default function Toast({ message, error, onClear }) {
  const text = error || message
  const isError = Boolean(error)

  useEffect(() => {
    if (!text) return
    const timer = setTimeout(onClear, 4000)
    return () => clearTimeout(timer)
  }, [text, onClear])

  if (!text) return null

  return (
    <div className="fixed top-20 right-6 z-[100] animate-slide-in">
      <div
        className={`flex items-center gap-3 px-5 py-3.5 rounded-xl border shadow-2xl backdrop-blur-xl max-w-[400px] ${
          isError
            ? 'bg-red-500/10 border-red-500/30 text-red-400'
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
        }`}
      >
        {isError ? (
          <XCircle className="w-5 h-5 shrink-0" />
        ) : (
          <CheckCircle className="w-5 h-5 shrink-0" />
        )}
        <span className="text-sm font-medium">{text}</span>
        <button
          onClick={onClear}
          className="ml-2 p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
