import React, { useRef } from 'react';
import { X } from 'lucide-react';
import { useTabTrap, useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    useTabTrap(modalRef, isOpen);

    useKeyboardShortcuts({
        'Escape': onClose
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* OVERLAY */}
            <div className="absolute inset-0 bg-overlay/50 backdrop-blur-sm" onClick={onClose} />

            {/* DIALOG */}
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                className="glass-dialog relative w-full max-w-lg bg-surface border border-border rounded-lg shadow-2xl flex flex-col max-h-[90vh] animate-slideIn"
            >
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 id="modal-title" className="text-lg font-semibold text-foreground-strong">{title}</h2>
                    <button
                        onClick={onClose}
                        type="button"
                        aria-label="Close dialog"
                        title="Close dialog"
                        className="h-8 w-8 shrink-0 rounded-md flex items-center justify-center text-muted hover:text-foreground-strong hover:bg-surface-alt transition-colors"
                    >
                        <X size={18} aria-hidden />
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-6 text-foreground">
                    {children}
                </div>

                {footer && (
                    <div className="p-6 border-t border-border bg-surface-elevated rounded-b-lg flex justify-end gap-4">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};
