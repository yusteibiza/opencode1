import { useState, useEffect } from 'react';
import { productosAPI } from '../services/api';
import { formatMoneda } from '../services/utils';

function Productos() {
    const [productos, setProductos] = useState([]);
    const [formData, setFormData] = useState({
        codigo: '',
        nombre: '',
        descripcion: '',
        precio: '',
        stock: ''
    });
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);

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
        setFormData(producto);
        setEditingId(producto.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de eliminar este producto?')) {
            try {
                await productosAPI.delete(id);
                fetchProductos();
            } catch (error) {
                console.error('Error deleting producto:', error);
            }
        }
    };

    const resetForm = () => {
        setFormData({
            codigo: '',
            nombre: '',
            descripcion: '',
            precio: '',
            stock: ''
        });
        setEditingId(null);
        setShowForm(false);
    };

    return (
        <div className="container">
            <h1>Gestión de Productos</h1>
            <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                {showForm ? 'Cancelar' : 'Nuevo Producto'}
            </button>

            {showForm && (
                <form className="form" onSubmit={handleSubmit}>
                    <h2>{editingId ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                    <input
                        type="text"
                        placeholder="Código *"
                        value={formData.codigo}
                        onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                        required
                    />
                    <input
                        type="text"
                        placeholder="Nombre *"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        required
                    />
                    <input
                        type="text"
                        placeholder="Descripción"
                        value={formData.descripcion}
                        onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    />
                    <input
                        type="number"
                        step="0.01"
                        placeholder="Precio *"
                        value={formData.precio}
                        onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                        required
                    />
                    <input
                        type="number"
                        placeholder="Stock"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    />
                    <button type="submit" className="btn btn-success">
                        {editingId ? 'Actualizar' : 'Guardar'}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={resetForm}>
                        Limpiar
                    </button>
                </form>
            )}

            <table className="table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Código</th>
                        <th>Nombre</th>
                        <th>Descripción</th>
                        <th>Precio</th>
                        <th>Stock</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {productos.map((producto) => (
                        <tr key={producto.id}>
                            <td>{producto.id}</td>
                            <td>{producto.codigo}</td>
                            <td>{producto.nombre}</td>
                            <td>{producto.descripcion}</td>
                            <td>{formatMoneda(producto.precio)}</td>
                            <td>{producto.stock}</td>
                            <td>
                                <button className="btn btn-warning" onClick={() => handleEdit(producto)}>
                                    Editar
                                </button>
                                <button className="btn btn-danger" onClick={() => handleDelete(producto.id)}>
                                    Eliminar
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default Productos;
