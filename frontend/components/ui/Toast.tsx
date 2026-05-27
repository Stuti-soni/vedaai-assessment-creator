'use client';
import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';
import { useToastStore } from '@/store/toastStore';

export function ToastContainer() {
  const { toasts, remove } = useToastStore();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} {...t} onClose={() => remove(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ id, message, type, onClose }: { id: string; message: string; type: 'success' | 'error'; onClose: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const t = setTimeout(() => { setVisible(false); setTimeout(onClose, 300); }, 3500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all duration-300 ${
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
    } ${type === 'success' ? 'bg-gray-900 text-white' : 'bg-red-600 text-white'}`}>
      {type === 'success' ? <CheckCircle size={16} className="shrink-0" /> : <XCircle size={16} className="shrink-0" />}
      <span>{message}</span>
      <button onClick={() => { setVisible(false); setTimeout(onClose, 300); }} className="ml-1 opacity-60 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  );
}
