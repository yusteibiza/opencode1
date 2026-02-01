import { useState, useEffect, useMemo } from 'react';
import { clientesAPI, productosAPI, facturasAPI } from '../services/api';
import { formatMoneda } from '../services/utils';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

function Dashboard() {
    const [clientes, setClientes] = useState([]);
    const [productos, setProductos] = useState([]);
    const [facturas, setFacturas] = useState([]);
    const [loading, setLoading] = useState(true);

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
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const stats = useMemo(() => {
        const totalClientes = clientes.length;
        const totalProductos = productos.length;
        const totalFacturas = facturas.length;
        
        const totalVentas = facturas.reduce((sum, f) => sum + f.total, 0);
        const promedioFactura = totalFacturas > 0 ? totalVentas / totalFacturas : 0;
        
        const facturasPendientes = facturas.filter(f => f.estado === 'pendiente').length;
        const facturasPagadas = facturas.filter(f => f.estado === 'pagada').length;
        
        const productosStockBajo = productos.filter(p => p.stock > 0 && p.stock <= 5).length;
        const productosSinStock = productos.filter(p => p.stock === 0).length;
        
        return {
            totalClientes,
            totalProductos,
            totalFacturas,
            totalVentas,
            promedioFactura,
            facturasPendientes,
            facturasPagadas,
            productosStockBajo,
            productosSinStock
        };
    }, [clientes, productos, facturas]);

    const ventasPorMes = useMemo(() => {
        const meses = {};
        const mesesNombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        
        const hoy = new Date();
        for (let i = 5; i >= 0; i--) {
            const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
            const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
            meses[key] = { nombre: mesesNombres[fecha.getMonth()], total: 0, count: 0 };
        }
        
        facturas.forEach(f => {
            const fecha = new Date(f.fecha);
            const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
            if (meses[key]) {
                meses[key].total += f.total;
                meses[key].count += 1;
            }
        });
        
        return Object.values(meses);
    }, [facturas]);

    const lineChartData = {
        labels: ventasPorMes.map(m => m.nombre),
        datasets: [
            {
                label: 'Ventas (€)',
                data: ventasPorMes.map(m => m.total),
                borderColor: '#0078d4',
                backgroundColor: 'rgba(0, 120, 212, 0.1)',
                fill: true,
                tension: 0.4
            }
        ]
    };

    const facturasPorEstado = useMemo(() => {
        return {
            labels: ['Pagadas', 'Pendientes'],
            datasets: [{
                data: [stats.facturasPagadas, stats.facturasPendientes],
                backgroundColor: ['#107c10', '#ffc107'],
                borderWidth: 0
            }]
        };
    }, [stats]);

    const productosPorStock = useMemo(() => {
        const stockAlto = productos.filter(p => p.stock > 10).length;
        const stockMedio = productos.filter(p => p.stock > 5 && p.stock <= 10).length;
        
        return {
            labels: ['Stock Alto (>10)', 'Stock Medio (6-10)', 'Stock Bajo (1-5)', 'Sin Stock'],
            datasets: [{
                data: [stockAlto, stockMedio, stats.productosStockBajo, stats.productosSinStock],
                backgroundColor: ['#107c10', '#0078d4', '#ffc107', '#d13438'],
                borderWidth: 0
            }]
        };
    }, [productos, stats]);

    const topClientes = useMemo(() => {
        const clienteVentas = {};
        facturas.forEach(f => {
            if (!clienteVentas[f.cliente_nombre]) {
                clienteVentas[f.cliente_nombre] = { nombre: f.cliente_nombre, total: 0, facturas: 0 };
            }
            clienteVentas[f.cliente_nombre].total += f.total;
            clienteVentas[f.cliente_nombre].facturas += 1;
        });
        
        return Object.values(clienteVentas)
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);
    }, [facturas]);

    const topClientesChart = {
        labels: topClientes.map(c => c.nombre.length > 15 ? c.nombre.substring(0, 15) + '...' : c.nombre),
        datasets: [{
            label: 'Total Comprado (€)',
            data: topClientes.map(c => c.total),
            backgroundColor: '#0078d4',
            borderRadius: 4
        }]
    };

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    
    if (isDark) {
        lineChartData.datasets[0].borderColor = '#a855f7';
        lineChartData.datasets[0].backgroundColor = 'rgba(168, 85, 247, 0.2)';
        topClientesChart.datasets[0].backgroundColor = '#a855f7';
        facturasPorEstado.datasets[0].backgroundColor = ['#22c55e', '#fbbf24'];
        productosPorStock.datasets[0].backgroundColor = ['#22c55e', '#3b82f6', '#fbbf24', '#ef4444'];
    }

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { 
                labels: { 
                    color: isDark ? '#d8b4fe' : '#323130',
                    font: { size: 12 }
                }
            }
        },
        scales: isDark ? {
            x: { 
                ticks: { color: '#a855f7' },
                grid: { color: '#4c1d95' }
            },
            y: { 
                ticks: { 
                    color: '#a855f7',
                    callback: (value) => formatMoneda(value)
                },
                grid: { color: '#4c1d95' }
            }
        } : {
            y: {
                ticks: {
                    callback: (value) => formatMoneda(value)
                }
            }
        }
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: isDark ? '#d8b4fe' : '#323130',
                    font: { size: 11 },
                    padding: 15
                }
            }
        }
    };

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
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">Resumen general del sistema</p>
                </div>
                <button className="btn btn-primary" onClick={fetchData}>
                    🔄 Actualizar
                </button>
            </div>

            {/* Stats - Fila 1 */}
            <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap',
                gap: '20px',
                marginBottom: '20px'
            }}>
                <div className="card" style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    padding: '16px',
                    flex: '1 1 200px',
                    minWidth: '200px'
                }}>
                    <div style={{ 
                        width: '44px', 
                        height: '44px', 
                        borderRadius: '8px', 
                        background: isDark ? 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)' : 'linear-gradient(135deg, #0078d4 0%, #106ebe 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px'
                    }}>
                        👥
                    </div>
                    <div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Clientes</div>
                        <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {stats.totalClientes}
                        </div>
                    </div>
                </div>

                <div className="card" style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    padding: '16px',
                    flex: '1 1 200px',
                    minWidth: '200px'
                }}>
                    <div style={{ 
                        width: '44px', 
                        height: '44px', 
                        borderRadius: '8px', 
                        background: isDark ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px'
                    }}>
                        📦
                    </div>
                    <div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Productos</div>
                        <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {stats.totalProductos}
                        </div>
                    </div>
                </div>

                <div className="card" style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    padding: '16px',
                    flex: '1 1 200px',
                    minWidth: '200px'
                }}>
                    <div style={{ 
                        width: '44px', 
                        height: '44px', 
                        borderRadius: '8px', 
                        background: isDark ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 'linear-gradient(135deg, #107c10 0%, #0b5d0b 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px'
                    }}>
                        📄
                    </div>
                    <div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Facturas</div>
                        <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {stats.totalFacturas}
                        </div>
                    </div>
                </div>

                <div className="card" style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    padding: '16px',
                    flex: '1 1 200px',
                    minWidth: '200px'
                }}>
                    <div style={{ 
                        width: '44px', 
                        height: '44px', 
                        borderRadius: '8px', 
                        background: isDark ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' : 'linear-gradient(135deg, #ffc107 0%, #f59e0b 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px'
                    }}>
                        💰
                    </div>
                    <div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Ventas</div>
                        <div style={{ fontSize: '24px', fontWeight: 600, color: isDark ? '#fbbf24' : '#0078d4' }}>
                            {formatMoneda(stats.totalVentas)}
                        </div>
                    </div>
                </div>
            </div>

            const ventas6MesesTotal = ventasPorMes.reduce((sum, m) => sum + m.total, 0);
    const ventasPromedioMes = ventas6MesesTotal / 6;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">Resumen general del sistema</p>
                </div>
                <button className="btn btn-primary" onClick={fetchData}>
                    🔄 Actualizar
                </button>
            </div>

            {/* Stats - Fila 1 */}
            <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap',
                gap: '20px',
                marginBottom: '20px'
            }}>
                <div className="card" style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    padding: '16px',
                    flex: '1 1 200px',
                    minWidth: '200px'
                }}>
                    <div style={{ 
                        width: '44px', 
                        height: '44px', 
                        borderRadius: '8px', 
                        background: isDark ? 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)' : 'linear-gradient(135deg, #0078d4 0%, #106ebe 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px'
                    }}>
                        👥
                    </div>
                    <div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Clientes</div>
                        <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {stats.totalClientes}
                        </div>
                    </div>
                </div>

                <div className="card" style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    padding: '16px',
                    flex: '1 1 200px',
                    minWidth: '200px'
                }}>
                    <div style={{ 
                        width: '44px', 
                        height: '44px', 
                        borderRadius: '8px', 
                        background: isDark ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px'
                    }}>
                        📦
                    </div>
                    <div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Productos</div>
                        <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {stats.totalProductos}
                        </div>
                    </div>
                </div>

                <div className="card" style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    padding: '16px',
                    flex: '1 1 200px',
                    minWidth: '200px'
                }}>
                    <div style={{ 
                        width: '44px', 
                        height: '44px', 
                        borderRadius: '8px', 
                        background: isDark ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 'linear-gradient(135deg, #107c10 0%, #0b5d0b 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px'
                    }}>
                        📄
                    </div>
                    <div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Facturas</div>
                        <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {stats.totalFacturas}
                        </div>
                    </div>
                </div>

                <div className="card" style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    padding: '16px',
                    flex: '1 1 200px',
                    minWidth: '200px'
                }}>
                    <div style={{ 
                        width: '44px', 
                        height: '44px', 
                        borderRadius: '8px', 
                        background: isDark ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' : 'linear-gradient(135deg, #ffc107 0%, #f59e0b 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px'
                    }}>
                        💰
                    </div>
                    <div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Ventas</div>
                        <div style={{ fontSize: '24px', fontWeight: 600, color: isDark ? '#fbbf24' : '#0078d4' }}>
                            {formatMoneda(stats.totalVentas)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Gráficos - Fila 2 */}
            <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap',
                gap: '20px',
                marginBottom: '20px'
            }}>
                <div className="card" style={{ flex: '1 1 400px', minWidth: '400px', height: '300px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <h3 className="card-title" style={{ fontSize: '14px', margin: 0 }}>📈 Ventas Últimos 6 Meses</h3>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '11px' }}>
                            <span style={{ color: isDark ? '#a855f7' : '#0078d4', fontWeight: 600 }}>
                                Total: {formatMoneda(ventas6MesesTotal)}
                            </span>
                            <span style={{ color: 'var(--text-muted)' }}>
                                Promedio: {formatMoneda(ventasPromedioMes)}/mes
                            </span>
                        </div>
                    </div>
                    <div style={{ height: 'calc(100% - 35px)' }}>
                        <Line data={lineChartData} options={chartOptions} />
                    </div>
                </div>

                <div className="card" style={{ flex: '1 1 400px', minWidth: '400px', height: '300px' }}>
                    <h3 className="card-title" style={{ marginBottom: '12px', fontSize: '14px' }}>📊 Estado de Facturas</h3>
                    <div style={{ height: 'calc(100% - 60px)', display: 'flex', justifyContent: 'center' }}>
                        <Doughnut data={facturasPorEstado} options={doughnutOptions} />
                    </div>
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        gap: '16px',
                        marginTop: '12px'
                    }}>
                        <span className="badge badge-success" style={{ fontSize: '11px' }}>Pagadas: {stats.facturasPagadas}</span>
                        <span className="badge badge-warning" style={{ fontSize: '11px' }}>Pendientes: {stats.facturasPendientes}</span>
                    </div>
                </div>
            </div>

            {/* Gráficos - Fila 3 */}
            <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap',
                gap: '20px',
                marginBottom: '20px'
            }}>
                <div className="card" style={{ flex: '1 1 400px', minWidth: '400px', height: '300px' }}>
                    <h3 className="card-title" style={{ marginBottom: '12px', fontSize: '14px' }}>🏆 Top 5 Clientes</h3>
                    <div style={{ height: 'calc(100% - 30px)' }}>
                        <Bar data={topClientesChart} options={chartOptions} />
                    </div>
                </div>

                <div className="card" style={{ flex: '1 1 400px', minWidth: '400px', height: '300px' }}>
                    <h3 className="card-title" style={{ marginBottom: '12px', fontSize: '14px' }}>📦 Inventario por Stock</h3>
                    <div style={{ height: 'calc(100% - 60px)', display: 'flex', justifyContent: 'center' }}>
                        <Doughnut data={productosPorStock} options={doughnutOptions} />
                    </div>
                    {stats.productosSinStock > 0 && (
                        <div style={{ 
                            textAlign: 'center', 
                            marginTop: '12px',
                            padding: '10px',
                            background: isDark ? 'rgba(239, 68, 68, 0.2)' : 'var(--ms-danger-bg)',
                            borderRadius: '4px',
                            color: isDark ? '#ef4444' : '#d13438',
                            fontSize: '12px'
                        }}>
                            ⚠️ {stats.productosSinStock} productos sin stock
                        </div>
                    )}
                </div>
            </div>

            {/* Resumen - Fila 4 */}
            <div className="card">
                <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap',
                    gap: '20px',
                    alignItems: 'center',
                    justifyContent: 'space-around'
                }}>
                    <div style={{ textAlign: 'center', flex: '1 1 200px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            Promedio por Factura
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {formatMoneda(stats.promedioFactura)}
                        </div>
                    </div>
                    <div style={{ textAlign: 'center', flex: '1 1 200px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            Productos Stock Bajo
                        </div>
                        <div style={{ 
                            fontSize: '20px', 
                            fontWeight: 600, 
                            color: stats.productosStockBajo > 0 ? (isDark ? '#fbbf24' : '#ffc107') : (isDark ? '#22c55e' : '#107c10')
                        }}>
                            {stats.productosStockBajo}
                        </div>
                    </div>
                    <div style={{ textAlign: 'center', flex: '1 1 200px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            Facturas Pendientes
                        </div>
                        <div style={{ 
                            fontSize: '20px', 
                            fontWeight: 600, 
                            color: stats.facturasPendientes > 0 ? (isDark ? '#fbbf24' : '#ffc107') : 'var(--text-primary)'
                        }}>
                            {stats.facturasPendientes}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
