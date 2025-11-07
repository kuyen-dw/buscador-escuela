// js/script.js

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQVcV9knYkFtsZ3C8FGqhhRAbtqNKMsh-NfIqWqwtYJTViOkHU1YX4rVCAZboQPZp3hztbPP-mdsY-Q/pub?output=csv';

let datosCompletos = [];
let datosFiltrados = [];

// 🟢 CORRECCIÓN CLAVE: Nuevo orden de las columnas en tu CSV
const HEADERS = [
    'ApellidoNombre', // Índice 0
    'Cargo',          // Índice 1
    'Turno',          // Índice 2
    'Curso',          // Índice 3
    'Seccion',        // Índice 4
    'Grupo',          // Índice 5
    'CicloTecnicatura'// Índice 6
];

// IDs de los selectores
const FILTER_IDS = [
    'filtroDocente', 
    'filtroCargo',
    'filtroTurno',
    'filtroCurso',
    'filtroSeccion',
    'filtroGrupo',
    'filtroCiclo'
];

// --- FUNCIONES DE BASE ---

function parseCSV(csv) {
    const lines = csv.split('\n').filter(line => line.trim() !== '');
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (!values || values.length < HEADERS.length) continue; 
        
        const row = {};
        
        HEADERS.forEach((header, index) => {
            row[header] = values[index] ? values[index].trim() : ''; 
        });
        
        if (row.ApellidoNombre.trim() !== '') {
            data.push(row);
        }
    }
    return data;
}

async function cargarDatos() {
    const contenedor = document.getElementById('resultadoTablaContainer');
    contenedor.innerHTML = '<p>Cargando datos. Por favor, espere...</p>';

    try {
        const response = await fetch(CSV_URL);
        const csvData = await response.text();
        
        datosCompletos = parseCSV(csvData);
        datosFiltrados = datosCompletos; 
        
        if (datosCompletos.length > 0) {
            FILTER_IDS.forEach((id, index) => {
                llenarFiltro(id, HEADERS[index], datosCompletos);
            });
            contenedor.innerHTML = `<p>Datos cargados. Total de registros: <strong>${datosCompletos.length}</strong>. Inicie la búsqueda.</p>`;
            mostrarResultadosTabla();
        } else {
            contenedor.innerHTML = '<p style="color: red;">Error: No se encontraron datos válidos en la hoja.</p>';
        }
    } catch (error) {
        contenedor.innerHTML = '<p style="color: red;">Error al conectar con la fuente de datos. Verifique la conexión o el permiso CORS.</p>';
        console.error('Error de carga:', error);
    }
}

function llenarFiltro(selectId, headerKey, sourceData) {
    const select = document.getElementById(selectId);
    const valorSeleccionadoAnterior = select.value;
    
    select.innerHTML = `<option value="">-- Seleccione ${headerKey.replace(/([A-Z])/g, ' $1').trim()} (Todos) --</option>`;

    const valoresUnicos = new Set();
    let hayCeldasVacias = false;
    
    sourceData.forEach(item => {
        let valor = item[headerKey].trim();
        
        if (valor !== '') {
            valoresUnicos.add(valor);
        } else {
            hayCeldasVacias = true;
        }
    });

    const opcionesDisponibles = Array.from(valoresUnicos).sort();
    
    opcionesDisponibles.forEach(valor => {
        const option = document.createElement('option');
        option.value = valor;
        option.textContent = valor;
        select.appendChild(option);
    });
    
    if (hayCeldasVacias && headerKey !== 'ApellidoNombre') {
         const emptyOption = document.createElement('option');
         emptyOption.value = ''; 
         emptyOption.textContent = '❌ Sin Asignar / Vacío';
         select.appendChild(emptyOption);
    }
    
    // 🟢 Lógica de restauración mejorada (se aplica a todos los filtros)
    if (valorSeleccionadoAnterior === '' || opcionesDisponibles.includes(valorSeleccionadoAnterior)) {
        select.value = valorSeleccionadoAnterior;
    } else {
        select.value = '';
    }
}

function aplicarFiltros() {
    const filtrosActivos = {};
    
    // 1. Recoger los filtros activos (TODOS)
    FILTER_IDS.forEach((id, index) => {
        const select = document.getElementById(id);
        if (select.value !== '') { 
            filtrosActivos[HEADERS[index]] = select.value;
        }
    });
    
    // 2. Aplicar el filtro estricto al conjunto completo de datos
    datosFiltrados = datosCompletos.filter(item => {
        for (const key in filtrosActivos) {
            const valorFiltro = filtrosActivos[key];
            const valorItem = item[key];
            
            if (valorFiltro && valorItem !== valorFiltro) {
                return false; 
            }
        }
        return true; 
    });

    // 3. Rellenar los desplegables (CASCADA)
    for (let i = 0; i < FILTER_IDS.length; i++) {
        const idActual = FILTER_IDS[i];
        const headerActual = HEADERS[i];
        
        // La lógica de llenado y restauración está en llenarFiltro()
        llenarFiltro(idActual, headerActual, datosFiltrados);
    }
    
    // 4. Mostrar el resultado final en la tabla
    mostrarResultadosTabla();
}

function mostrarResultadosTabla() {
    const contenedor = document.getElementById('resultadoTablaContainer');
    
    if (datosFiltrados.length === 0) {
        contenedor.innerHTML = '<p style="color: orange;">No se encontraron asignaciones que coincidan con los filtros.</p>';
        return;
    }

    const tablaHTML = `
        <p>Se encontraron <strong>${datosFiltrados.length}</strong> resultados:</p>
        <table class="tabla-resultados">
            <thead>
                <tr>
                    ${HEADERS.map(h => `<th>${h.replace(/([A-Z])/g, ' $1').trim()}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
                ${datosFiltrados.map(item => `
                    <tr>
                        <td><strong>${item.ApellidoNombre}</strong></td>
                        <td>${item.Cargo}</td>
                        <td>${item.Turno}</td>
                        <td>${item.Curso}</td>
                        <td>${item.Seccion}</td>
                        <td>${item.Grupo}</td>
                        <td>${item.CicloTecnicatura}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    contenedor.innerHTML = tablaHTML;
}

// Inicia la carga de datos
window.onload = cargarDatos;