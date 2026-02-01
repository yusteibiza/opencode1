import { useState, useEffect } from 'react';

// Componente de alerta modal global
export const useAlertModal = () => {
    const [modalState, setModalState] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info', // 'info', 'warning', 'danger', 'success'
        onConfirm: null,
        onCancel: null,
        confirmText: 'Aceptar',
        cancelText: 'Cancelar',
        showCancel: true
    });

    const showAlert = ({ 
        title, 
        message, 
        type = 'info', 
        onConfirm = null, 
        onCancel = null,
        confirmText = 'Aceptar',
        cancelText = 'Cancelar',
        showCancel = true
    }) => {
        setModalState({
            isOpen: true,
            title,
            message,
            type,
            onConfirm,
            onCancel,
            confirmText,
            cancelText,
            showCancel
        });
    };

    const hideAlert = () => {
        setModalState(prev => ({ ...prev, isOpen: false }));
    };

    const handleConfirm = () => {
        if (modalState.onConfirm) {
            modalState.onConfirm();
        }
        hideAlert();
    };

    const handleCancel = () => {
        if (modalState.onCancel) {
            modalState.onCancel();
        }
        hideAlert();
    };

    return {
        modalState,
        showAlert,
        hideAlert,
        handleConfirm,
        handleCancel
    };
};

// Componente JSX del modal
export const AlertModal = ({ 
    isOpen, 
    title, 
    message, 
    type = 'info',
    onConfirm, 
    onCancel, 
    confirmText = 'Aceptar',
    cancelText = 'Cancelar',
    showCancel = true 
}) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'danger': return '❌';
            case 'warning': return '⚠️';
            case 'success': return '✅';
            default: return 'ℹ️';
        }
    };

    const getButtonClass = () => {
        switch (type) {
            case 'danger': return 'btn-danger';
            case 'warning': return 'btn-warning';
            case 'success': return 'btn-success';
            default: return 'btn-primary';
        }
    };

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
                <div className="modal-body" style={{ textAlign: 'center', padding: '2rem' }}>
                    <div style={{ 
                        fontSize: '3rem', 
                        marginBottom: '1rem',
                        animation: 'scaleIn 0.3s ease-out'
                    }}>
                        {getIcon()}
                    </div>
                    <h3 style={{ 
                        fontSize: '1.25rem', 
                        fontWeight: 600, 
                        color: 'var(--text-primary)',
                        marginBottom: '0.75rem' 
                    }}>
                        {title}
                    </h3>
                    <p style={{ 
                        color: 'var(--text-secondary)', 
                        marginBottom: '1.5rem',
                        lineHeight: 1.5 
                    }}>
                        {message}
                    </p>
                    <div style={{ 
                        display: 'flex', 
                        gap: '0.75rem', 
                        justifyContent: 'center' 
                    }}>
                        {showCancel && (
                            <button 
                                className="btn btn-secondary" 
                                onClick={onCancel}
                            >
                                {cancelText}
                            </button>
                        )}
                        <button 
                            className={`btn ${getButtonClass()}`} 
                            onClick={onConfirm}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
