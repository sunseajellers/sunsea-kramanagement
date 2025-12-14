// src/components/Modal.tsx
'use client';

import { ReactNode, useEffect } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    confirmLabel?: string;
    onConfirm?: () => void;
}

export default function Modal({
    isOpen,
    onClose,
    title = 'Confirm',
    children,
    confirmLabel = 'Confirm',
    onConfirm,
}: ModalProps) {
    // Close on Escape key
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-md w-full p-6">
                <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">{title}</h2>
                <div className="mb-6 dark:text-gray-200">{children}</div>
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                    >
                        Cancel
                    </button>
                    {onConfirm && (
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className="px-4 py-2 rounded bg-primary-600 text-white hover:bg-primary-700"
                        >
                            {confirmLabel}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
