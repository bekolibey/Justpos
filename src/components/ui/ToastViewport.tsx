import { X } from 'lucide-react';

import { usePOS } from '../../state/POSContext';

const toneClassMap = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  error: 'border-rose-200 bg-rose-50 text-rose-900',
  info: 'border-slate-200 bg-white text-slate-900',
} as const;

export const ToastViewport = () => {
  const { toasts, dismissToast } = usePOS();

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start justify-between rounded-xl border px-3 py-3 shadow-md ${toneClassMap[toast.tone]}`}
        >
          <p className="pr-3 text-sm font-medium">{toast.message}</p>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            className="rounded-md p-1 text-slate-500 transition hover:bg-black/5"
            aria-label="Bildirimi kapat"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
