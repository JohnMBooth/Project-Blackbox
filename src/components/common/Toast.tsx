import { useUIStore } from '../../stores/uiStore';

const TYPE_STYLES: Record<string, { bg: string; icon: string }> = {
  info: { bg: 'rgba(0, 180, 255, 0.15)', icon: 'ℹ' },
  success: { bg: 'rgba(0, 255, 136, 0.15)', icon: '✓' },
  warning: { bg: 'rgba(255, 215, 0, 0.15)', icon: '⚠' },
  error: { bg: 'rgba(255, 51, 85, 0.15)', icon: '✕' },
};

export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);
  const removeToast = useUIStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-16 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => {
        const style = TYPE_STYLES[t.type] || TYPE_STYLES.info;
        return (
          <div
            key={t.id}
            className="glass-panel rounded-lg px-4 py-3 flex items-center gap-3 animate-slide-up text-sm min-w-[280px] max-w-[400px]"
            style={{ borderLeft: `3px solid ${style.bg.replace('0.15', '0.8')}`, background: style.bg }}
          >
            <span style={{ color: style.bg.replace('0.15', '1') }}>{style.icon}</span>
            <span className="flex-1" style={{ color: 'var(--surface-300)' }}>{t.message}</span>
            <button className="btn btn-ghost p-0.5" onClick={() => removeToast(t.id)}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
