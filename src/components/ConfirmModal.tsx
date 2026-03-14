"use client";

import { AlertCircle, CheckCircle2, X } from "lucide-react";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type?: "danger" | "success" | "info";
  confirmText?: string;
  cancelText?: string;
};

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = "info",
  confirmText = "Ya, Lanjutkan",
  cancelText = "Batal",
}: ModalProps) {
  if (!isOpen) return null;

  const typeConfig = {
    danger: {
      icon: <AlertCircle className="text-red-600 dark:text-red-400" size={24} />,
      bg: "bg-red-100 dark:bg-red-900/30",
      button: "bg-red-600 hover:bg-red-700 text-white",
    },
    success: {
      icon: <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" size={24} />,
      bg: "bg-emerald-100 dark:bg-emerald-900/30",
      button: "bg-emerald-600 hover:bg-emerald-700 text-white",
    },
    info: {
      icon: <AlertCircle className="text-blue-600 dark:text-blue-400" size={24} />,
      bg: "bg-blue-100 dark:bg-blue-900/30",
      button: "bg-blue-600 hover:bg-blue-700 text-white",
    },
  };

  const config = typeConfig[type];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl ${config.bg}`}>
              {config.icon}
            </div>
            <button 
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 italic">
            {title}
          </h3>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed italic text-sm">
            {message}
          </p>
        </div>
        
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            {cancelText}
          </button>
          {onConfirm && (
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all shadow-lg active:scale-95 ${config.button}`}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
