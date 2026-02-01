import { useState } from 'react';
import { 
    LayoutDashboard, 
    ChevronDown, 
    ChevronRight,
    Users,
    Package,
    FileText,
    BarChart3,
    Moon,
    Sun
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

function Sidebar({ onNavigate, currentView }) {
    const [expandedMenus, setExpandedMenus] = useState({
        ventas: true,
        catalogos: false,
        reportes: false
    });
    const { theme, toggleTheme } = useTheme();

    const toggleMenu = (menu) => {
        setExpandedMenus(prev => ({
            ...prev,
            [menu]: !prev[menu]
        }));
    };

    const menuItems = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: LayoutDashboard,
            view: 'dashboard'
        },
        {
            id: 'ventas',
            label: 'Ventas',
            icon: FileText,
            submenu: [
                { id: 'facturas', label: 'Facturas', view: 'facturas' },
                { id: 'nueva-factura', label: 'Nueva Factura', view: 'nueva-factura' }
            ]
        },
        {
            id: 'catalogos',
            label: 'Catálogos',
            icon: Package,
            submenu: [
                { id: 'clientes', label: 'Clientes', view: 'clientes' },
                { id: 'productos', label: 'Productos', view: 'productos' }
            ]
        },
        {
            id: 'reportes',
            label: 'Reportes',
            icon: BarChart3,
            view: 'reportes'
        }
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <h2>Sistema de Facturación</h2>
            </div>
            
            <nav className="sidebar-nav">
                {menuItems.map(item => (
                    <div key={item.id} className="menu-item">
                        {item.submenu ? (
                            <>
                                <button 
                                    className="menu-button"
                                    onClick={() => toggleMenu(item.id)}
                                >
                                    <item.icon size={20} />
                                    <span>{item.label}</span>
                                    {expandedMenus[item.id] ? 
                                        <ChevronDown size={16} /> : 
                                        <ChevronRight size={16} />
                                    }
                                </button>
                                {expandedMenus[item.id] && (
                                    <div className="submenu">
                                        {item.submenu.map(sub => (
                                            <button
                                                key={sub.id}
                                                className={`submenu-item ${currentView === sub.view ? 'active' : ''}`}
                                                onClick={() => onNavigate(sub.view)}
                                            >
                                                {sub.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <button 
                                className={`menu-button ${currentView === item.view ? 'active' : ''}`}
                                onClick={() => onNavigate(item.view)}
                            >
                                <item.icon size={20} />
                                <span>{item.label}</span>
                            </button>
                        )}
                    </div>
                ))}
            </nav>

            <div className="sidebar-footer">
                <button className="theme-toggle" onClick={toggleTheme}>
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                    <span>{theme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}</span>
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;
