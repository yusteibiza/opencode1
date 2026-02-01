import { useState, useEffect } from 'react';
import { clientesAPI } from '../services/api';

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

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de eliminar este cliente?')) {
            try {
                await clientesAPI.delete(id);
                fetchClientes();
            } catch (error) {
                console.error('Error deleting cliente:', error);
            }
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
        <div className="container">
            <h1>Gestión de Clientes</h1>
            <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                {showForm ? 'Cancelar' : 'Nuevo Cliente'}
            </button>

            {showForm && (
                <form className="form" onSubmit={handleSubmit}>
                    <h2>{editingId ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
                    <input
                        type="text"
                        placeholder="Nombre *"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        required
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                    <input
                        type="tel"
                        placeholder="Teléfono"
                        value={formData.telefono}
                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    />
                    <input
                        type="text"
                        placeholder="Dirección"
                        value={formData.direccion}
                        onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
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
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Teléfono</th>
                        <th>Dirección</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {clientes.map((cliente) => (
                        <tr key={cliente.id}>
                            <td>{cliente.id}</td>
                            <td>{cliente.nombre}</td>
                            <td>{cliente.email}</td>
                            <td>{cliente.telefono}</td>
                            <td>{cliente.direccion}</td>
                            <td>
                                <button className="btn btn-warning" onClick={() => handleEdit(cliente)}>
                                    Editar
                                </button>
                                <button className="btn btn-danger" onClick={() => handleDelete(cliente.id)}>
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

export default Clientes;
