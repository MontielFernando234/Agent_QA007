#!/usr/bin/env node
/**
 * Automated Quality Auditor for qa_designer & qa_orchestrator:
 * Validates functional test cases CSV (12 columns) against project Rules:
 * - RFC 4180 double-quoted structure and 12 required columns
 * - Nomenclature format ([R<N>] FE|BE - WB|MB|API - XXX - AREA - ID_HU - Nombre - Titulo)
 * - Minimum 2 atomic steps per test case
 * - No residual "sanity" in Tipo de prueba or Tags
 * - Valid BTipoPrueba, BCaminoPrueba, BPrioridadTC, BComplejidad values
 * - Bimonetarismo check (no U$S / US$ instead of USD)
 *
 * Usage:
 *   node validate_test_cases.js <csv_path>
 */

const fs = require('fs');
const path = require('path');

const csvPath = process.argv[2];
if (!csvPath) {
    console.error('Usage: node validate_test_cases.js <csv_path>');
    process.exit(1);
}

function parseCSV(content) {
    const rows = [];
    let currentRow = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        const nextChar = content[i + 1];

        if (inQuotes) {
            if (char === '"' && nextChar === '"') {
                currentField += '"';
                i++;
            } else if (char === '"') {
                inQuotes = false;
            } else {
                currentField += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                currentRow.push(currentField);
                currentField = '';
            } else if (char === '\n') {
                currentRow.push(currentField);
                rows.push(currentRow);
                currentRow = [];
                currentField = '';
            } else if (char === '\r') {
                // ignore
            } else {
                currentField += char;
            }
        }
    }
    if (currentField !== '' || currentRow.length > 0) {
        currentRow.push(currentField);
        rows.push(currentRow);
    }
    return rows;
}

const raw = fs.readFileSync(path.resolve(csvPath), 'utf8');
const rows = parseCSV(raw);

if (rows.length < 2) {
    console.error(JSON.stringify({ status: 'FAIL', error: 'El CSV no contiene filas de datos.' }, null, 2));
    process.exit(1);
}

const expectedHeaders = [
    'Nombre del caso de prueba',
    'Área',
    'Objetivo',
    'Precondiciones',
    'Datos',
    'Pasos',
    'Resultado esperado',
    'Prioridad',
    'Complejidad',
    'Tipo de prueba',
    'Camino de prueba',
    'Tags'
];

const headers = rows[0].map(h => h.trim());
const errors = [];
const warnings = [];

if (headers.length !== 12) {
    errors.push(`Cantidad de columnas inválida: se esperaban 12, se encontraron ${headers.length}.`);
} else {
    for (let i = 0; i < expectedHeaders.length; i++) {
        if (headers[i].toLowerCase() !== expectedHeaders[i].toLowerCase()) {
            warnings.push(`Columna #${i + 1}: esperado "${expectedHeaders[i]}", encontrado "${headers[i]}".`);
        }
    }
}

const titleRegex = /^(?:\[R\d+\]\s+)?(?:FE|BE)\s+-\s+(?:WB|MB|API|CS|DS|SP)\s+-\s+\d{3}\s+-\s+[A-Z0-9_]+\s+-\s+\d+\s+-\s+.+?\s+-\s+.+$/;
const validTypes = new Set(['0 - Funcional', '1 - Smoke', '3 - Regression']);
const validPaths = new Set(['Positivo', 'Negativo']);
const validLevels = new Set(['1 - Alta', '2 - Media', '3 - Baja']);

const dataRows = rows.slice(1).filter(r => r.some(c => c.trim() !== ''));

dataRows.forEach((row, idx) => {
    const rowNum = idx + 2;
    if (row.length !== 12) {
        errors.push(`Fila ${rowNum}: tiene ${row.length} columnas en lugar de 12.`);
        return;
    }

    const [nombre, area, objetivo, precond, datos, pasos, resultado, prioridad, complejidad, tipo, camino, tags] = row.map(c => c.trim());

    if (!titleRegex.test(nombre)) {
        errors.push(`Fila ${rowNum}: Título no cumple nomenclatura oficial -> "${nombre}"`);
    }

    const stepLines = pasos.split(/\\n|\r?\n/).map(l => l.trim()).filter(Boolean);
    if (stepLines.length < 2) {
        errors.push(`Fila ${rowNum}: Tiene ${stepLines.length} paso(s); se requieren mínimo 2 pasos atómicos.`);
    }

    if (/sanity/i.test(tipo) || /sanity/i.test(tags)) {
        errors.push(`Fila ${rowNum}: Uso prohibido de "Sanity" en Tipo de prueba o Tags (mapear a 1 - Smoke o 3 - Regression).`);
    }

    if (!validTypes.has(tipo)) {
        errors.push(`Fila ${rowNum}: Tipo de prueba inválido "${tipo}". Permitidos: 0 - Funcional, 1 - Smoke, 3 - Regression.`);
    }

    if (!validPaths.has(camino)) {
        errors.push(`Fila ${rowNum}: Camino de prueba inválido "${camino}". Permitidos: Positivo, Negativo.`);
    }

    if (!validLevels.has(prioridad)) {
        warnings.push(`Fila ${rowNum}: Prioridad no estándar "${prioridad}".`);
    }

    if (!validLevels.has(complejidad)) {
        warnings.push(`Fila ${rowNum}: Complejidad no estándar "${complejidad}".`);
    }

    const fullText = row.join(' ');
    if (/U\$S|US\$/i.test(fullText)) {
        errors.push(`Fila ${rowNum}: Bimonetarismo incorrecto (usar "USD" en lugar de "U$S" / "US$").`);
    }

    if (nombre.startsWith('[R') && !tags.includes('regression')) {
        warnings.push(`Fila ${rowNum}: El título indica Release [R...] pero Tags no incluye etiqueta de regresión.`);
    }

    if (!objetivo || !precond || !resultado) {
        errors.push(`Fila ${rowNum}: Objetivo, Precondiciones o Resultado esperado vacío.`);
    }
});

const result = {
    status: errors.length === 0 ? 'PASS' : 'FAIL',
    file: csvPath,
    total_cases: dataRows.length,
    errors_count: errors.length,
    warnings_count: warnings.length,
    errors,
    warnings
};

console.log(JSON.stringify(result, null, 2));
process.exit(errors.length === 0 ? 0 : 1);
