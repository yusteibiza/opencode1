import { useState, useEffect } from 'react';
import { productosAPI } from '../services/api';
import { formatMoneda } from '../services/utils';
import { AlertModal, useAlertModal } from './AlertModal';

function Productos() {
    const [productos, setProductos] = useState([]);
    const [formData, setFormData] = useState({
        codigo: '',
        nombre: '',
        descripcion: '',
        precio: '',
        iva_porcentaje: '21',
        stock: ''
    });
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const { modalState, showAlert, handleConfirm, handleCancel } = useAlertModal();

    useEffect(() => {
        fetchProductos();
    }, []);

    const fetchProductos = async () => {
        try {
            const response = await productosAPI.getAll();
            setProductos(response.data.productos);
        } catch (error) {
            console.error('Error fetching productos:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = {
                ...formData,
                precio: parseFloat(formData.precio),
                iva_porcentaje: parseFloat(formData.iva_porcentaje),
                stock: parseInt(formData.stock)
            };
            if (editingId) {
                await productosAPI.update(editingId, data);
            } else {
                await productosAPI.create(data);
            }
            fetchProductos();
            resetForm();
        } catch (error) {
            console.error('Error saving producto:', error);
        }
    };

    const handleEdit = (producto) => {
        setFormData({
            ...producto,
            iva_porcentaje: producto.iva_porcentaje?.toString() || '21'
        });
        setEditingId(producto.id);
        setShowForm(true);
    };

    const handleDelete = async (producto) => {
        showAlert({
            title: '¿Eliminar producto?',
            message: `¿Estás seguro de que quieres eliminar "${producto.nombre}"? Esta acción no se puede deshacer.`,
            type: 'danger',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            onConfirm: async () => {
                try {
                    await productosAPI.delete(producto.id);
                    fetchProductos();
                } catch (error) {
                    // Verificar si el error es porque el producto está en uso
                    if (error.response && error.response.data && error.response.data.code === 'PRODUCT_IN_USE') {
                        showAlert({
                            title: 'No se puede eliminar',
                            message: `El producto "${producto.nombre}" no puede ser eliminado porque está siendo utilizado en facturas existentes.`,
                            type: 'warning',
                            confirmText: 'Entendido',
                            showCancel: false
                        });
                    } else {
                        showAlert({
                            title: 'Error',
                            message: 'No se pudo eliminar el producto. Inténtelo de nuevo.',
                            type: 'danger',
                            confirmText: 'Aceptar',
                            showCancel: false
                        });
                    }
                }
            }
        });
    };

    const resetForm = () => {
        setFormData({
            codigo: '',
            nombre: '',
            descripcion: '',
            precio: '',
            iva_porcentaje: '21',
            stock: ''
        });
        setEditingId(null);
        setShowForm(false);
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Productos</h1>
                    <p className="page-subtitle">Administra tu catálogo de productos</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancelar' : '+ Nuevo Producto'}
                </button>
            </div>

            {showForm && (
                <div className="form-section">
                    <h2 className="form-title">{editingId ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Código *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Ej: PROD-001"
                                    value={formData.codigo}
                                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Nombre *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Ej: Laptop Dell XPS"
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Descripción</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Breve descripción del producto"
                                    value={formData.descripcion}
                                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                />
                            </div>
                            <div className="form-group" style={{ maxWidth: '160px' }}>
                                <label className="form-label">Precio *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="form-input"
                                    placeholder="0.00"
                                    value={formData.precio}
                                    onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group" style={{ maxWidth: '120px' }}>
                                <label className="form-label">IVA %</label>
                                <select
                                    className="form-select"
                                    value={formData.iva_porcentaje}
                                    onChange={(e) => setFormData({ ...formData, iva_porcentaje: e.target.value })}
                                >
                                    <option value="0">0%</option>
                                    <option value="4">4%</option>
                                    <option value="10">10%</option>
                                    <option value="21">21%</option>
                                </select>
                            </div>
                            <div className="form-group" style={{ maxWidth: '120px' }}>
                                <label className="form-label">Stock</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    placeholder="0"
                                    value={formData.stock}
                                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
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
                            <th>Código</th>
                            <th>Nombre</th>
                            <th>Descripción</th>
                            <th style={{ textAlign: 'right' }}>Precio</th>
                            <th style={{ textAlign: 'center' }}>IVA</th>
                            <th style={{ textAlign: 'center' }}>Stock</th>
                            <th style={{ textAlign: 'right' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {productos.length === 0 ? (
                            <tr>
                                <td colSpan="7">
                                    <div className="empty-state">
                                        <div className="empty-state-icon">📦</div>
                                        <div className="empty-state-title">No hay productos</div>
                                        <div>Agrega tu primer producto para comenzar</div>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            productos.map((producto) => (
                                <tr key={producto.id}>
                                    <td>
                                        <span style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                            {producto.codigo}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{producto.nombre}</td>
                                    <td>{producto.descripcion || '-'}</td>
                                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--primary)' }}>
                                        {formatMoneda(producto.precio)}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span className="badge badge-info">{producto.iva_porcentaje || 21}%</span>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span className={producto.stock > 10 ? 'badge badge-success' : producto.stock > 0 ? 'badge badge-warning' : 'badge badge-danger'}>
                                            {producto.stock}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button className="btn btn-sm btn-ghost" onClick={() => handleEdit(producto)}>
                                            ✏️ Editar
                                        </button>
                                        <button className="btn btn-sm btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(producto)}>
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
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                confirmText={modalState.confirmText}
                cancelText={modalState.cancelText}
                showCancel={modalState.showCancel}
            />
        </div>
    );
}

export default Productos;
