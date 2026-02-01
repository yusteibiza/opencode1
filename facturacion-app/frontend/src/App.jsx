import { useState } from 'react';
import Clientes from './components/Clientes';
import Productos from './components/Productos';
import Facturas from './components/Facturas';

function App() {
    const [vistaActual, setVistaActual] = useState('clientes');

    return (
        <div className="App">
            <nav className="navbar">
                <h1>Sistema de Facturación</h1>
                <div className="nav-links">
                    <button 
                        className={`nav-link ${vistaActual === 'clientes' ? 'active' : ''}`}
                        onClick={() => setVistaActual('clientes')}
                    >
                        Clientes
                    </button>
                    <button 
                        className={`nav-link ${vistaActual === 'productos' ? 'active' : ''}`}
                        onClick={() => setVistaActual('productos')}
                    >
                        Productos
                    </button>
                    <button 
                        className={`nav-link ${vistaActual === 'facturas' ? 'active' : ''}`}
                        onClick={() => setVistaActual('facturas')}
                    >
                        Facturas
                    </button>
                </div>
            </nav>

            <main>
                {vistaActual === 'clientes' && <Clientes />}
                {vistaActual === 'productos' && <Productos />}
                {vistaActual === 'facturas' && <Facturas />}
            </main>
        </div>
    );
}

export default App;
