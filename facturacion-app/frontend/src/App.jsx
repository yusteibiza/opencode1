import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Clientes from './components/Clientes';
import Productos from './components/Productos';
import Facturas from './components/Facturas';
import Listados from './components/Listados';

function App() {
    const [vistaActual, setVistaActual] = useState('dashboard');
    const [theme, setTheme] = useState('light');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [menuExpandido, setMenuExpandido] = useState({
        facturacion: true,
        listados: false,
        configuracion: false
    });

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        const savedSidebarState = localStorage.getItem('sidebarCollapsed') === 'true';
        setTheme(savedTheme);
        setSidebarCollapsed(savedSidebarState);
        document.documentElement.setAttribute('data-theme', savedTheme);
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    };

    const toggleSidebar = () => {
        const newState = !sidebarCollapsed;
        setSidebarCollapsed(newState);
        localStorage.setItem('sidebarCollapsed', newState);
    };

    const toggleMenu = (seccion) => {
        setMenuExpandido(prev => ({
            ...prev,
            [seccion]: !prev[seccion]
        }));
    };

    const seleccionarVista = (vista) => {
        setVistaActual(vista);
    };

    return (
        <div className="App">
            <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <div className="sidebar-logo-icon">📊</div>
                        <span>Facturación</span>
                    </div>
                    <button 
                        className="sidebar-toggle" 
                        onClick={toggleSidebar}
                        title={sidebarCollapsed ? 'Expandir menú' : 'Contraer menú'}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {/* Dashboard - separado del acordeón */}
                    <button
                        className={`sidebar-nav-item ${vistaActual === 'dashboard' ? 'active' : ''}`}
                        onClick={() => seleccionarVista('dashboard')}
                    >
                        <span className="sidebar-nav-icon">📈</span>
                        <span className="sidebar-nav-text">Dashboard</span>
                    </button>

                    {/* Sección Facturación */}
                    <div className="menu-section">
                        <button 
                            className="menu-header" 
                            onClick={() => toggleMenu('facturacion')}
                        >
                            <span className="menu-header-icon">📁</span>
                            <span className="menu-header-text">Facturación</span>
                            <span className={`menu-arrow ${menuExpandido.facturacion ? 'open' : ''}`}>▼</span>
                        </button>
                        <div className={`menu-content ${menuExpandido.facturacion ? 'open' : ''}`}>
                            <button
                                className={`sidebar-nav-item ${vistaActual === 'clientes' ? 'active' : ''}`}
                                onClick={() => seleccionarVista('clientes')}
                            >
                                <span className="sidebar-nav-icon">👥</span>
                                <span className="sidebar-nav-text">Clientes</span>
                            </button>
                            <button
                                className={`sidebar-nav-item ${vistaActual === 'productos' ? 'active' : ''}`}
                                onClick={() => seleccionarVista('productos')}
                            >
                                <span className="sidebar-nav-icon">📦</span>
                                <span className="sidebar-nav-text">Productos</span>
                            </button>
                            <button
                                className={`sidebar-nav-item ${vistaActual === 'facturas' ? 'active' : ''}`}
                                onClick={() => seleccionarVista('facturas')}
                            >
                                <span className="sidebar-nav-icon">📄</span>
                                <span className="sidebar-nav-text">Facturas</span>
                            </button>
                        </div>
                    </div>

                    {/* Sección Listados */}
                    <div className="menu-section">
                        <button 
                            className="menu-header" 
                            onClick={() => toggleMenu('listados')}
                        >
                            <span className="menu-header-icon">📊</span>
                            <span className="menu-header-text">Listados</span>
                            <span className={`menu-arrow ${menuExpandido.listados ? 'open' : ''}`}>▼</span>
                        </button>
                        <div className={`menu-content ${menuExpandido.listados ? 'open' : ''}`}>
                            <button
                                className={`sidebar-nav-item ${vistaActual === 'listados' ? 'active' : ''}`}
                                onClick={() => seleccionarVista('listados')}
                            >
                                <span className="sidebar-nav-icon">📋</span>
                                <span className="sidebar-nav-text">Reportes</span>
                            </button>
                        </div>
                    </div>

                    {/* Sección Configuración */}
                    <div className="menu-section">
                        <button 
                            className="menu-header" 
                            onClick={() => toggleMenu('configuracion')}
                        >
                            <span className="menu-header-icon">⚙️</span>
                            <span className="menu-header-text">Configuración</span>
                            <span className={`menu-arrow ${menuExpandido.configuracion ? 'open' : ''}`}>▼</span>
                        </button>
                        <div className={`menu-content ${menuExpandido.configuracion ? 'open' : ''}`}>
                            <button className="theme-toggle-menu" onClick={toggleTheme}>
                                <span>{theme === 'light' ? '🌙' : '☀️'}</span>
                                <span>{theme === 'light' ? 'Modo oscuro' : 'Modo claro'}</span>
                            </button>
                        </div>
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <div className="app-version">v1.0.0</div>
                </div>
            </aside>

            <div className="main-content">
                <main>
                    {vistaActual === 'dashboard' && <Dashboard />}
                    {vistaActual === 'clientes' && <Clientes />}
                    {vistaActual === 'productos' && <Productos />}
                    {vistaActual === 'facturas' && <Facturas />}
                    {vistaActual === 'listados' && <Listados />}
                </main>
            </div>
        </div>
    );
}

export default App;
