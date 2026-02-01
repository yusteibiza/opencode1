export const formatMoneda = (valor) => {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(valor);
};

export const formatFecha = (fecha) => {
    if (!fecha) return '';
    const fechaObj = new Date(fecha);
    if (isNaN(fechaObj.getTime())) {
        const [year, month, day] = fecha.split('-');
        return `${day}/${month}/${year}`;
    }
    return fechaObj.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

export const formatFechaISO = (fecha) => {
    if (!fecha) return '';
    const [day, month, year] = fecha.split('/');
    return `${year}-${month}-${day}`;
};

export const formatNumero = (valor, decimales = 2) => {
    return new Intl.NumberFormat('es-ES', {
        minimumFractionDigits: decimales,
        maximumFractionDigits: decimales
    }).format(valor);
};
