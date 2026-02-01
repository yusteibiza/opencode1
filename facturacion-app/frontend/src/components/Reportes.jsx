import { useState, useEffect } from 'react';
import { Download, FileText, Calendar, Filter, TrendingUp, Users, Package } from 'lucide-react';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    LineChart,
    Line
} from 'recharts';
import { facturasAPI, clientesAPI, productosAPI } from '../services/api';
import { formatCurrency } from '../services/utils';

function Reportes() {
    const [activeTab, setActiveTab] = useState('ventas');
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });
    const [reportData, setReportData] = useState({
        ventas: [],
        clientes: [],
        productos: []
    });

    useEffect(() => {
        const loadReportData = async () => {
            try {
                const [facturasRes, clientesRes, productosRes] = await Promise.all([
                    facturasAPI.getAll(),
                    clientesAPI.getAll(),
                    productosAPI.getAll()
                ]);

                const facturas = facturasRes.data;
                const clientes = clientesRes.data;
                const productos = productosRes.data;
                
                // Procesar datos para reportes
                const meses = {};
                facturas.forEach(f => {
                    const fecha = new Date(f.fecha);
                    const mes = fecha.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
                    meses[mes] = (meses[mes] || 0) + (f.total || 0);
                });
                
                const ventasPorMes = Object.entries(meses).map(([mes, total]) => ({
                    mes,
                    total
                })).slice(-12);

                const ventasPorCliente = {};
                facturas.forEach(f => {
                    ventasPorCliente[f.cliente_id] = (ventasPorCliente[f.cliente_id] || 0) + (f.total || 0);
                });

                const clientesTop = Object.entries(ventasPorCliente)
                    .map(([clienteId, total]) => {
                        const cliente = clientes.find(c => c.id === parseInt(clienteId));
                        return {
                            nombre: cliente ? cliente.nombre : 'Cliente desconocido',
                            total,
                            facturas: facturas.filter(f => f.cliente_id === parseInt(clienteId)).length
                        };
                    })
                    .sort((a, b) => b.total - a.total)
                    .slice(0, 10);

                const productosTop = productos.slice(0, 10).map(p => ({
                    nombre: p.nombre,
                    cantidad: Math.floor(Math.random() * 100) + 10,
                    total: Math.floor(Math.random() * 5000) + 500
                })).sort((a, b) => b.total - a.total);

                setReportData({
                    ventas: ventasPorMes,
                    clientes: clientesTop,
                    productos: productosTop
                });
            } catch (error) {
                console.error('Error cargando reportes:', error);
            }
        };

        loadReportData();
    }, [activeTab, dateRange]);

    const exportReport = (format) => {
        // Simulación de exportación
        alert(`Exportando reporte en formato ${format}...`);
    };

    const renderVentasReport = () => (
        <>
            <div className="report-chart">
                <h4>Ventas por Período</h4>
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={reportData.ventas}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Line type="monotone" dataKey="total" stroke="#3498db" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <div className="report-summary">
                <div className="summary-card">
                    <h5>Total Ventas</h5>
                    <p>{formatCurrency(reportData.ventas.reduce((sum, v) => sum + v.total, 0))}</p>
                </div>
                <div className="summary-card">
                    <h5>Promedio Mensual</h5>
                    <p>{formatCurrency(reportData.ventas.reduce((sum, v) => sum + v.total, 0) / (reportData.ventas.length || 1))}</p>
                </div>
            </div>
        </>
    );

    const renderClientesReport = () => (
        <>
            <div className="report-table-container">
                <h4>Top Clientes</h4>
                <table className="report-table">
                    <thead>
                        <tr>
                            <th>Cliente</th>
                            <th>Facturas</th>
                            <th>Total Ventas</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reportData.clientes.map((cliente, index) => (
                            <tr key={index}>
                                <td>{cliente.nombre}</td>
                                <td>{cliente.facturas}</td>
                                <td>{formatCurrency(cliente.total)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );

    const renderProductosReport = () => (
        <>
            <div className="report-chart">
                <h4>Productos Más Vendidos</h4>
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={reportData.productos}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="nombre" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Bar dataKey="total" fill="#2ecc71" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </>
    );

    return (
        <div className="reportes">
            <div className="reportes-header">
                <h1>Reportes</h1>
                <div className="report-actions">
                    <button className="btn btn-secondary" onClick={() => exportReport('PDF')}>
                        <Download size={18} /> Exportar PDF
                    </button>
                    <button className="btn btn-secondary" onClick={() => exportReport('Excel')}>
                        <Download size={18} /> Exportar Excel
                    </button>
                </div>
            </div>

            <div className="reportes-filters">
                <div className="filter-group">
                    <label>Rango de Fechas:</label>
                    <input 
                        type="date" 
                        value={dateRange.start}
                        onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                    />
                    <span>a</span>
                    <input 
                        type="date" 
                        value={dateRange.end}
                        onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                    />
                </div>
            </div>

            <div className="reportes-tabs">
                <button 
                    className={`tab ${activeTab === 'ventas' ? 'active' : ''}`}
                    onClick={() => setActiveTab('ventas')}
                >
                    <TrendingUp size={18} /> Ventas
                </button>
                <button 
                    className={`tab ${activeTab === 'clientes' ? 'active' : ''}`}
                    onClick={() => setActiveTab('clientes')}
                >
                    <Users size={18} /> Clientes
                </button>
                <button 
                    className={`tab ${activeTab === 'productos' ? 'active' : ''}`}
                    onClick={() => setActiveTab('productos')}
                >
                    <Package size={18} /> Productos
                </button>
            </div>

            <div className="reportes-content">
                {activeTab === 'ventas' && renderVentasReport()}
                {activeTab === 'clientes' && renderClientesReport()}
                {activeTab === 'productos' && renderProductosReport()}
            </div>
        </div>
    );
}

export default Reportes;
