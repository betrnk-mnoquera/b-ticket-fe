import Icon from './Icon'

export default function ErrorState({ message = 'Something went wrong', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-full bg-error-bg flex items-center justify-center mb-3">
        <Icon name="error" size={24} className="text-destructive" />
      </div>
      <p className="text-sm text-muted-foreground mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white hover:opacity-90 flex items-center gap-1.5"
        >
          <Icon name="refresh" size={14} /> Try Again
        </button>
      )}
    </div>
  )
}
