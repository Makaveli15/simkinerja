'use client';

import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  LuTriangleAlert, 
  LuCircleCheck, 
  LuCircleX, 
  LuInfo, 
  LuCircleHelp,
  LuX
} from 'react-icons/lu';

export type AlertType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type?: AlertType;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  isLoading?: boolean;
}

const alertConfig = {
  success: {
    icon: LuCircleCheck,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    buttonBg: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500',
    headerBg: 'from-emerald-500 to-teal-500',
  },
  error: {
    icon: LuCircleX,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    buttonBg: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    headerBg: 'from-red-500 to-rose-500',
  },
  warning: {
    icon: LuTriangleAlert,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    buttonBg: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
    headerBg: 'from-amber-500 to-orange-500',
  },
  info: {
    icon: LuInfo,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    buttonBg: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    headerBg: 'from-blue-500 to-indigo-500',
  },
  confirm: {
    icon: LuCircleHelp,
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    buttonBg: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500',
    headerBg: 'from-indigo-500 to-purple-500',
  },
};

export default function AlertModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'info',
  confirmText = 'Oke',
  cancelText = 'Batal',
  showCancel = false,
  isLoading = false,
}: AlertModalProps) {
  const config = alertConfig[type];
  const Icon = config.icon;

  // Handle escape key
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && !isLoading) {
      onClose();
    }
  }, [onClose, isLoading]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleEscape]);

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn" />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md transform animate-scaleIn overflow-hidden">
        {/* Header gradient */}
        <div className={`h-2 bg-gradient-to-r ${config.headerBg}`} />
        
        {/* Close button */}
        {!isLoading && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
          >
            <LuX className="w-5 h-5" />
          </button>
        )}
        
        {/* Content */}
        <div className="p-6 pt-8">
          {/* Icon */}
          <div className="flex justify-center mb-5">
            <div className={`p-4 rounded-full ${config.iconBg} animate-bounce-subtle`}>
              <Icon className={`w-10 h-10 ${config.iconColor}`} />
            </div>
          </div>
          
          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900 text-center mb-3">
            {title}
          </h3>
          
          {/* Message */}
          <p className="text-gray-600 text-center leading-relaxed mb-6">
            {message}
          </p>
          
          {/* Buttons */}
          <div className={`flex gap-3 ${showCancel ? 'justify-center' : 'justify-center'}`}>
            {showCancel && (
              <button
                onClick={onClose}
                disabled={isLoading}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className={`px-6 py-2.5 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 ${config.buttonBg} min-w-[100px] flex items-center justify-center gap-2`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Use portal to render modal at document body level
  if (typeof window !== 'undefined') {
    return createPortal(modalContent, document.body);
  }
  
  return null;
}

// Hook untuk menggunakan alert modal dengan mudah
import { useState } from 'react';

interface AlertState {
  isOpen: boolean;
  type: AlertType;
  title: string;
  message: string;
  showCancel: boolean;
  confirmText: string;
  cancelText: string;
  onConfirm?: () => void;
  isLoading: boolean;
}

export function useAlertModal() {
  const [alertState, setAlertState] = useState<AlertState>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    showCancel: false,
    confirmText: 'Oke',
    cancelText: 'Batal',
    onConfirm: undefined,
    isLoading: false,
  });

  const showAlert = (options: {
    type?: AlertType;
    title: string;
    message: string;
    confirmText?: string;
  }) => {
    setAlertState({
      isOpen: true,
      type: options.type || 'info',
      title: options.title,
      message: options.message,
      showCancel: false,
      confirmText: options.confirmText || 'Oke',
      cancelText: 'Batal',
      onConfirm: undefined,
      isLoading: false,
    });
  };

  const showConfirm = (options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: AlertType;
    onConfirm: () => void | Promise<void>;
  }) => {
    setAlertState({
      isOpen: true,
      type: options.type || 'confirm',
      title: options.title,
      message: options.message,
      showCancel: true,
      confirmText: options.confirmText || 'Ya, Lanjutkan',
      cancelText: options.cancelText || 'Batal',
      onConfirm: async () => {
        setAlertState(prev => ({ ...prev, isLoading: true }));
        try {
          await options.onConfirm();
        } finally {
          setAlertState(prev => ({ ...prev, isOpen: false, isLoading: false }));
        }
      },
      isLoading: false,
    });
  };

  const showSuccess = (title: string, message: string) => {
    showAlert({ type: 'success', title, message });
  };

  const showError = (title: string, message: string) => {
    showAlert({ type: 'error', title, message });
  };

  const showWarning = (title: string, message: string) => {
    showAlert({ type: 'warning', title, message });
  };

  const showInfo = (title: string, message: string) => {
    showAlert({ type: 'info', title, message });
  };

  const closeAlert = () => {
    if (!alertState.isLoading) {
      setAlertState(prev => ({ ...prev, isOpen: false }));
    }
  };

  const AlertModalComponent = () => (
    <AlertModal
      isOpen={alertState.isOpen}
      onClose={closeAlert}
      onConfirm={alertState.onConfirm}
      title={alertState.title}
      message={alertState.message}
      type={alertState.type}
      confirmText={alertState.confirmText}
      cancelText={alertState.cancelText}
      showCancel={alertState.showCancel}
      isLoading={alertState.isLoading}
    />
  );

  return {
    showAlert,
    showConfirm,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    closeAlert,
    AlertModal: AlertModalComponent,
  };
}
