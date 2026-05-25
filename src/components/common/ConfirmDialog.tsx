import React from 'react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmDanger?: boolean;
  children?: React.ReactNode;
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', confirmDanger = false, children }: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} width="400px">
      <p className="text-sm mb-4" style={{ color: 'var(--surface-400)' }}>{message}</p>
      {children}
      <div className="flex justify-end gap-2 mt-4">
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button
          className={`btn ${confirmDanger ? 'btn-danger' : 'btn-primary'}`}
          onClick={() => { onConfirm(); onClose(); }}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
