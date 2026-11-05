import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;
  const Icon = toast.type === 'error' ? AlertCircle : CheckCircle2;
  return (
    <div className={`toast toast-${toast.type}`} role={toast.type === 'error' ? 'alert' : 'status'}>
      <Icon size={19} />
      <span>{toast.message}</span>
      <button className="icon-button" aria-label="Cerrar mensaje" onClick={onClose}><X size={17} /></button>
    </div>
  );
}
