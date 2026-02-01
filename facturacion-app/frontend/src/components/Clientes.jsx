import { useState, useEffect } from 'react';
import { clientesAPI } from '../services/api';
import { AlertModal, useAlertModal } from './AlertModal';

function Clientes() {
    const [clientes, setClientes] = useState([]);
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        telefono: '',
        direccion: ''
    });
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [clienteToDelete, setClienteToDelete] = useState(null);

    const { modalState, showAlert, hideAlert, handleConfirm, handleCancel } = useAlertModal();

    useEffect(() => {
        fetchClientes();
    }, []);

    const fetchClientes = async () => {
        try {
            const response = await clientesAPI.getAll();
            setClientes(response.data.clientes);
        } catch (error) {
            console.error('Error fetching clientes:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await clientesAPI.update(editingId, formData);
            } else {
                await clientesAPI.create(formData);
            }
            fetchClientes();
            resetForm();
        } catch (error) {
            console.error('Error saving cliente:', error);
        }
    };

    const handleEdit = (cliente) => {
        setFormData(cliente);
        setEditingId(cliente.id);
        setShowForm(true);
    };

    const confirmDelete = (id) => {
        const cliente = clientes.find(c => c.id === id);
        setClienteToDelete(cliente);
        showAlert({
            title: '¿Eliminar cliente?',
            message: `¿Está seguro de que desea eliminar al cliente "${cliente?.nombre}"? Esta acción no se puede deshacer.`,
            type: 'danger',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            onConfirm: () => executeDelete(id),
            onCancel: () => setClienteToDelete(null)
        });
    };

    const executeDelete = async (id) => {
        try {
            await clientesAPI.delete(id);
            fetchClientes();
            setClienteToDelete(null);
        } catch (error) {
            console.error('Error deleting cliente:', error);
            showAlert({
                title: 'Error',
                message: 'No se pudo eliminar el cliente. Inténtelo de nuevo.',
                type: 'danger',
                showCancel: false,
                confirmText: 'Aceptar'
            });
        }
    };

    const resetForm = () => {
        setFormData({
            nombre: '',
            email: '',
            telefono: '',
            direccion: ''
        });
        setEditingId(null);
        setShowForm(false);
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Clientes</h1>
                    <p className="page-subtitle">Gestiona la información de tus clientes</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancelar' : '+ Nuevo Cliente'}
                </button>
            </div>

            {showForm && (
                <div className="form-section">
                    <h2 className="form-title">{editingId ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Nombre completo *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Ej: Juan Pérez"
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Correo electrónico</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    placeholder="Ej: juan@email.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Teléfono</label>
                                <input
                                    type="tel"
                                    className="form-input"
                                    placeholder="Ej: +54 11 1234-5678"
                                    value={formData.telefono}
                                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Dirección</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Ej: Av. Principal 123"
                                    value={formData.direccion}
                                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="form-actions">
                            <button type="button" className="btn btn-secondary" onClick={resetForm}>
                                Cancelar
                            </button>
                            <button type="submit" className="btn btn-success">
                                {editingId ? 'Actualizar' : 'Guardar'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Email</th>
                            <th>Teléfono</th>
                            <th>Dirección</th>
                            <th style={{ textAlign: 'right' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clientes.length === 0 ? (
                            <tr>
                                <td colSpan="6">
                                    <div className="empty-state">
                                        <div className="empty-state-icon">👥</div>
                                        <div className="empty-state-title">No hay clientes</div>
                                        <div>Agrega tu primer cliente para comenzar</div>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            clientes.map((cliente) => (
                                <tr key={cliente.id}>
                                    <td>#{cliente.id}</td>
                                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{cliente.nombre}</td>
                                    <td>{cliente.email || '-'}</td>
                                    <td>{cliente.telefono || '-'}</td>
                                    <td>{cliente.direccion || '-'}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button className="btn btn-sm btn-ghost" onClick={() => handleEdit(cliente)}>
                                            ✏️ Editar
                                        </button>
                                        <button className="btn btn-sm btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => confirmDelete(cliente.id)}>
                                            🗑️ Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <AlertModal
                isOpen={modalState.isOpen}
                title={modalState.title}
                message={modalState.message}
                type={modalState.type}
                confirmText={modalState.confirmText}
                cancelText={modalState.cancelText}
                showCancel={modalState.showCancel}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />
        </div>
    );
}

export default Clientes;
