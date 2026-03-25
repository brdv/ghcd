import { useEffect } from "react";

export type ToastType = "error" | "warning" | "success";

export interface ToastMessage {
  id: number;
  type: ToastType;
  text: string;
}

const styles: Record<ToastType, string> = {
  error: "bg-red-900/90 border-gh-danger text-red-200",
  warning: "bg-yellow-900/90 border-yellow-600 text-yellow-200",
  success: "bg-green-900/90 border-green-600 text-green-200",
};

const icons: Record<ToastType, string> = {
  error: "\u2715",
  warning: "\u26A0",
  success: "\u2713",
};

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
}

export default function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className={`flex items-center gap-2.5 px-4 py-3 rounded-lg border text-sm shadow-lg animate-slide-in ${styles[toast.type]}`}
    >
      <span className="text-base leading-none">{icons[toast.type]}</span>
      <span className="flex-1">{toast.text}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="bg-transparent border-none text-current opacity-60 hover:opacity-100 cursor-pointer text-base leading-none p-0"
      >
        &times;
      </button>
    </div>
  );
}
