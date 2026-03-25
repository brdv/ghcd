import { createContext, type ReactNode, useContext } from "react";
import type { ToastType } from "../components/Toast";
import ToastContainer from "../components/Toast";
import { useToasts } from "./useToasts";

interface ToastContextValue {
  addToast: (type: ToastType, text: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const { toasts, addToast, dismissToast } = useToasts();

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
