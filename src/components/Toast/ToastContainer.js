// src/components/Toast/ToastContainer.js
import React from 'react';
import { useToast } from './ToastContext';
import Toast from './Toast';
import './Toast.css';

const ToastContainer = () => {
  const { toasts } = useToast();

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
};

export default ToastContainer;
