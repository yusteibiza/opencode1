import { useState, useEffect, useMemo } from 'react';
import { clientesAPI, productosAPI, facturasAPI } from '../services/api';
import { formatMoneda, formatFecha } from '../services/utils';
import jsPDF from 'jspdf';

function Listados() {
    const [activeTab, setActiveTab] = useState('facturas-cliente');
    const [clientes, setClientes] = useState([]);
    const [productos, setProductos] = useState([]);
    const [facturas, setFacturas] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filtros
    const [filtroCliente, setFiltroCliente] = useState('');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [estadoFactura, setEstadoFactura] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [clientesRes, productosRes, facturasRes] = await Promise.all([
                clientesAPI.getAll(),
                productosAPI.getAll(),
                facturasAPI.getAll()
            ]);
            setClientes(clientesRes.data.clientes);
            setProductos(productosRes.data.productos);
            setFacturas(facturasRes.data.facturas);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Listado 1: Facturas por Cliente
    const facturasPorCliente = useMemo(() => {
        if (!filtroCliente) return [];
        return facturas
            .filter(f => f.cliente_id === parseInt(filtroCliente))
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    }, [facturas, filtroCliente]);

    // Listado 2: Facturas por Periodo
    const facturasPorPeriodo = useMemo(() => {
        if (!fechaInicio || !fechaFin) return [];
        const inicio = new Date(fechaInicio);
        const fin = new Date(fechaFin);
        return facturas
            .filter(f => {
                const fecha = new Date(f.fecha);
                return fecha >= inicio && fecha <= fin;
            })
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    }, [facturas, fechaInicio, fechaFin]);

    // Listado 3: Facturas Pendientes
    const facturasPendientes = useMemo(() => {
        return facturas
            .filter(f => f.estado === 'pendiente')
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    }, [facturas]);

    // Listado 4: Productos más Vendidos
    const productosMasVendidos = useMemo(() => {
        const ventasProductos = {};
        facturas.forEach(f => {
            f.items?.forEach(item => {
                if (!ventasProductos[item.producto_id]) {
                    const producto = productos.find(p => p.id === item.producto_id);
                    ventasProductos[item.producto_id] = {
                        id: item.producto_id,
                        nombre: item.producto_nombre || (producto?.nombre || 'Producto desconocido'),
                        cantidad: 0,
                        total: 0
                    };
                }
                ventasProductos[item.producto_id].cantidad += item.cantidad;
                ventasProductos[item.producto_id].total += item.subtotal;
            });
        });
        return Object.values(ventasProductos)
            .sort((a, b) => b.cantidad - a.cantidad)
            .slice(0, 20);
    }, [facturas, productos]);

    // Listado 5: Mejores Clientes
    const mejoresClientes = useMemo(() => {
        const ventasClientes = {};
        facturas.forEach(f => {
            if (!ventasClientes[f.cliente_id]) {
                ventasClientes[f.cliente_id] = {
                    id: f.cliente_id,
                    nombre: f.cliente_nombre,
                    facturas: 0,
                    total: 0
                };
            }
            ventasClientes[f.cliente_id].facturas += 1;
            ventasClientes[f.cliente_id].total += f.total;
        });
        return Object.values(ventasClientes)
            .sort((a, b) => b.total - a.total)
            .slice(0, 20);
    }, [facturas]);

    // Listado 6: Stock Bajo
    const productosStockBajo = useMemo(() => {
        return productos
            .filter(p => p.stock <= 5)
            .sort((a, b) => a.stock - b.stock);
    }, [productos]);

    const exportarPDF = (titulo, data, columns) => {
        const doc = new jsPDF();
        doc.text(titulo, 14, 15);
        
        let y = 25;
        data.forEach((row, index) => {
            if (y > 280) {
                doc.addPage();
                y = 15;
            }
            let x = 14;
            columns.forEach(col => {
                const value = typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor];
                doc.text(`${col.header}: ${value}`, x, y);
                x += 60;
            });
            y += 8;
        });
        
        doc.save(`${titulo.toLowerCase().replace(/\s+/g, '-')}.pdf`);
    };

    const tabs = [
        { id: 'facturas-cliente', label: '📄 Por Cliente', icon: '👤' },
        { id: 'facturas-periodo', label: '📅 Por Periodo', icon: '📆' },
        { id: 'facturas-pendientes', label: '⏳ Pendientes', icon: '⏰' },
        { id: 'productos-ventas', label: '📊 Prod. Más Vendidos', icon: '🏆' },
        { id: 'mejores-clientes', label: '👑 Mejores Clientes', icon: '⭐' },
        { id: 'stock-bajo', label: '⚠️ Stock Bajo', icon: '📦' }
    ];

    if (loading) {
        return (
            <div className="page-header">
                <div className="empty-state">
                    <div className="empty-state-icon">⏳</div>
                    <div className="empty-state-title">Cargando...</div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Listados y Reportes</h1>
                    <p className="page-subtitle">Consultas y análisis detallados</p>
                </div>
                <button className="btn btn-primary" onClick={fetchData}>
                    🔄 Actualizar
                </button>
            </div>

            {/* Tabs de listados */}
            <div style={{ 
                display: 'flex', 
                gap: '8px', 
                marginBottom: '20px',
                flexWrap: 'wrap'
            }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab(tab.id)}
                        style={{ fontSize: '13px' }}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Contenido según tab activo */}
            <div className="card">
                {activeTab === 'facturas-cliente' && (
                    <div>
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', alignItems: 'flex-end' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Cliente</label>
                                <select 
                                    className="form-control"
                                    value={filtroCliente}
                                    onChange={(e) => setFiltroCliente(e.target.value)}
                                >
                                    <option value="">Seleccione un cliente</option>
                                    {clientes.map(c => (
                                        <option key={c.id} value={c.id}>{c.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <button 
                                className="btn btn-secondary"
                                onClick={() => exportarPDF('Facturas por Cliente', facturasPorCliente, [
                                    { header: 'Nº', accessor: 'id' },
                                    { header: 'Fecha', accessor: f => formatFecha(f.fecha) },
                                    { header: 'Total', accessor: f => formatMoneda(f.total) }
                                ])}
                                disabled={!facturasPorCliente.length}
                            >
                                📄 Exportar PDF
                            </button>
                        </div>
                        
                        {facturasPorCliente.length > 0 ? (
                            <div>
                                <div style={{ marginBottom: '12px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                                    <strong>Total facturas:</strong> {facturasPorCliente.length} | 
                                    <strong> Importe total:</strong> {formatMoneda(facturasPorCliente.reduce((sum, f) => sum + f.total, 0))}
                                </div>
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Nº Factura</th>
                                            <th>Fecha</th>
                                            <th>Estado</th>
                                            <th style={{ textAlign: 'right' }}>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {facturasPorCliente.map(f => (
                                            <tr key={f.id}>
                                                <td>#{f.id}</td>
                                                <td>{formatFecha(f.fecha)}</td>
                                                <td>
                                                    <span className={`badge badge-${f.estado === 'pagada' ? 'success' : 'warning'}`}>
                                                        {f.estado === 'pagada' ? 'Pagada' : 'Pendiente'}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatMoneda(f.total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : filtroCliente ? (
                            <div className="empty-state" style={{ padding: '40px' }}>
                                <div className="empty-state-icon">📭</div>
                                <div className="empty-state-title">No hay facturas</div>
                                <div className="empty-state-description">Este cliente no tiene facturas registradas</div>
                            </div>
                        ) : (
                            <div className="empty-state" style={{ padding: '40px' }}>
                                <div className="empty-state-icon">👤</div>
                                <div className="empty-state-title">Seleccione un cliente</div>
                                <div className="empty-state-description">Elija un cliente para ver sus facturas</div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'facturas-periodo' && (
                    <div>
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', alignItems: 'flex-end' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Fecha Inicio</label>
                                <input 
                                    type="date" 
                                    className="form-control"
                                    value={fechaInicio}
                                    onChange={(e) => setFechaInicio(e.target.value)}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Fecha Fin</label>
                                <input 
                                    type="date" 
                                    className="form-control"
                                    value={fechaFin}
                                    onChange={(e) => setFechaFin(e.target.value)}
                                />
                            </div>
                            <button 
                                className="btn btn-secondary"
                                onClick={() => exportarPDF('Facturas por Periodo', facturasPorPeriodo, [
                                    { header: 'Nº', accessor: 'id' },
                                    { header: 'Cliente', accessor: 'cliente_nombre' },
                                    { header: 'Fecha', accessor: f => formatFecha(f.fecha) },
                                    { header: 'Total', accessor: f => formatMoneda(f.total) }
                                ])}
                                disabled={!facturasPorPeriodo.length}
                            >
                                📄 Exportar PDF
                            </button>
                        </div>
                        
                        {facturasPorPeriodo.length > 0 ? (
                            <div>
                                <div style={{ marginBottom: '12px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                                    <strong>Total facturas:</strong> {facturasPorPeriodo.length} | 
                                    <strong> Importe total:</strong> {formatMoneda(facturasPorPeriodo.reduce((sum, f) => sum + f.total, 0))}
                                </div>
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Nº Factura</th>
                                            <th>Cliente</th>
                                            <th>Fecha</th>
                                            <th>Estado</th>
                                            <th style={{ textAlign: 'right' }}>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {facturasPorPeriodo.map(f => (
                                            <tr key={f.id}>
                                                <td>#{f.id}</td>
                                                <td>{f.cliente_nombre}</td>
                                                <td>{formatFecha(f.fecha)}</td>
                                                <td>
                                                    <span className={`badge badge-${f.estado === 'pagada' ? 'success' : 'warning'}`}>
                                                        {f.estado === 'pagada' ? 'Pagada' : 'Pendiente'}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatMoneda(f.total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (fechaInicio && fechaFin) ? (
                            <div className="empty-state" style={{ padding: '40px' }}>
                                <div className="empty-state-icon">📭</div>
                                <div className="empty-state-title">No hay facturas</div>
                                <div className="empty-state-description">No hay facturas en el periodo seleccionado</div>
                            </div>
                        ) : (
                            <div className="empty-state" style={{ padding: '40px' }}>
                                <div className="empty-state-icon">📅</div>
                                <div className="empty-state-title">Seleccione un periodo</div>
                                <div className="empty-state-description">Elija fechas de inicio y fin para ver las facturas</div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'facturas-pendientes' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div style={{ padding: '12px', background: 'var(--ms-warning-bg)', borderRadius: '6px', color: 'var(--ms-warning-text)' }}>
                                <strong>⚠️ Total pendiente:</strong> {formatMoneda(facturasPendientes.reduce((sum, f) => sum + f.total, 0))} 
                                ({facturasPendientes.length} facturas)
                            </div>
                            <button 
                                className="btn btn-secondary"
                                onClick={() => exportarPDF('Facturas Pendientes', facturasPendientes, [
                                    { header: 'Nº', accessor: 'id' },
                                    { header: 'Cliente', accessor: 'cliente_nombre' },
                                    { header: 'Fecha', accessor: f => formatFecha(f.fecha) },
                                    { header: 'Total', accessor: f => formatMoneda(f.total) }
                                ])}
                                disabled={!facturasPendientes.length}
                            >
                                📄 Exportar PDF
                            </button>
                        </div>
                        
                        {facturasPendientes.length > 0 ? (
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Nº Factura</th>
                                        <th>Cliente</th>
                                        <th>Fecha</th>
                                        <th style={{ textAlign: 'right' }}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {facturasPendientes.map(f => (
                                        <tr key={f.id}>
                                            <td>#{f.id}</td>
                                            <td>{f.cliente_nombre}</td>
                                            <td>{formatFecha(f.fecha)}</td>
                                            <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--ms-warning-text)' }}>
                                                {formatMoneda(f.total)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="empty-state" style={{ padding: '40px' }}>
                                <div className="empty-state-icon">✅</div>
                                <div className="empty-state-title">¡Excelente!</div>
                                <div className="empty-state-description">No hay facturas pendientes de pago</div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'productos-ventas' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                            <button 
                                className="btn btn-secondary"
                                onClick={() => exportarPDF('Productos Mas Vendidos', productosMasVendidos, [
                                    { header: 'Producto', accessor: 'nombre' },
                                    { header: 'Cantidad', accessor: 'cantidad' },
                                    { header: 'Total', accessor: p => formatMoneda(p.total) }
                                ])}
                                disabled={!productosMasVendidos.length}
                            >
                                📄 Exportar PDF
                            </button>
                        </div>
                        
                        {productosMasVendidos.length > 0 ? (
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '50px' }}>#</th>
                                        <th>Producto</th>
                                        <th style={{ textAlign: 'center' }}>Cantidad Vendida</th>
                                        <th style={{ textAlign: 'right' }}>Total Ventas</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {productosMasVendidos.map((p, index) => (
                                        <tr key={p.id}>
                                            <td style={{ fontWeight: 600 }}>{index + 1}</td>
                                            <td>{p.nombre}</td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span className="badge badge-primary">{p.cantidad} unidades</span>
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatMoneda(p.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="empty-state" style={{ padding: '40px' }}>
                                <div className="empty-state-icon">📦</div>
                                <div className="empty-state-title">Sin ventas</div>
                                <div className="empty-state-description">Aún no hay productos vendidos registrados</div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'mejores-clientes' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                            <button 
                                className="btn btn-secondary"
                                onClick={() => exportarPDF('Mejores Clientes', mejoresClientes, [
                                    { header: 'Cliente', accessor: 'nombre' },
                                    { header: 'Facturas', accessor: 'facturas' },
                                    { header: 'Total', accessor: c => formatMoneda(c.total) }
                                ])}
                                disabled={!mejoresClientes.length}
                            >
                                📄 Exportar PDF
                            </button>
                        </div>
                        
                        {mejoresClientes.length > 0 ? (
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '50px' }}>#</th>
                                        <th>Cliente</th>
                                        <th style={{ textAlign: 'center' }}>Facturas</th>
                                        <th style={{ textAlign: 'right' }}>Total Comprado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {mejoresClientes.map((c, index) => (
                                        <tr key={c.id}>
                                            <td style={{ fontWeight: 600 }}>
                                                {index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                                            </td>
                                            <td>{c.nombre}</td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span className="badge badge-secondary">{c.facturas}</span>
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-success)' }}>
                                                {formatMoneda(c.total)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="empty-state" style={{ padding: '40px' }}>
                                <div className="empty-state-icon">👥</div>
                                <div className="empty-state-title">Sin datos</div>
                                <div className="empty-state-description">Aún no hay ventas registradas por cliente</div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'stock-bajo' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div style={{ padding: '12px', background: 'var(--ms-danger-bg)', borderRadius: '6px', color: 'var(--ms-danger-text)' }}>
                                <strong>⚠️ Atención:</strong> {productosStockBajo.length} productos con stock bajo o agotado
                            </div>
                            <button 
                                className="btn btn-secondary"
                                onClick={() => exportarPDF('Productos Stock Bajo', productosStockBajo, [
                                    { header: 'Producto', accessor: 'nombre' },
                                    { header: 'Stock', accessor: 'stock' },
                                    { header: 'Precio', accessor: p => formatMoneda(p.precio) }
                                ])}
                                disabled={!productosStockBajo.length}
                            >
                                📄 Exportar PDF
                            </button>
                        </div>
                        
                        {productosStockBajo.length > 0 ? (
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Producto</th>
                                        <th>Código</th>
                                        <th style={{ textAlign: 'center' }}>Stock Actual</th>
                                        <th style={{ textAlign: 'right' }}>Precio</th>
                                        <th>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {productosStockBajo.map(p => (
                                        <tr key={p.id}>
                                            <td>{p.nombre}</td>
                                            <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{p.codigo || '-'}</td>
                                            <td style={{ textAlign: 'center', fontWeight: 600 }}>
                                                <span className={`badge badge-${p.stock === 0 ? 'danger' : 'warning'}`}>
                                                    {p.stock} unidades
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>{formatMoneda(p.precio)}</td>
                                            <td>
                                                {p.stock === 0 ? (
                                                    <span style={{ color: 'var(--ms-danger-text)', fontWeight: 600 }}>SIN STOCK</span>
                                                ) : (
                                                    <span style={{ color: 'var(--ms-warning-text)' }}>Stock bajo</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="empty-state" style={{ padding: '40px' }}>
                                <div className="empty-state-icon">✅</div>
                                <div className="empty-state-title">¡Todo bien!</div>
                                <div className="empty-state-description">Todos los productos tienen stock suficiente</div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Listados;
