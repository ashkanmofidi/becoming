'use client';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'default' | 'destructive';
}

/**
 * Confirmation modal for timer actions.
 * PRD: Skip/Reset/Switch while running require confirmation.
 */
export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Continue',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'default',
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-bg-card border border-surface-700 rounded-xl p-6 max-w-sm w-full shadow-2xl" role="dialog">
        <h3 className="text-white font-semibold mb-2">{title}</h3>
        <p className="text-surface-300 text-sm mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-surface-300 border border-surface-700 rounded-lg hover:bg-surface-900 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              variant === 'destructive'
                ? 'bg-red-600 text-white hover:bg-red-500'
                : 'bg-amber text-white hover:bg-amber-light'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
