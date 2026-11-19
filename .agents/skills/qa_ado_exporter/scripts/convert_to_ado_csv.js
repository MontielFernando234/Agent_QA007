/**
 * Helper script for qa_ado_exporter:
 * Converts functional test cases CSV (from qa_designer) to Azure DevOps Web Import CSV format
 * (18 columns, multi-step structure, RFC 4180).
 *
 * Usage:
 *   node convert_to_ado_csv.js <input_csv_path> <output_csv_path> [area_path] [assigned_to] [iteration_path] [platform]
 */

const fs = require('fs');
const path = require('path');

function loadProjectConfig() {
    const configPath = path.join(process.cwd(), 'qa.config.json');
    if (fs.existsSync(configPath)) {
        try {
            return JSON.parse(fs.readFileSync(configPath, 'utf8'));
        } catch (e) {
            // Fallback to defaults
        }
    }
    return {};
}

const projectConfig = loadProjectConfig();

const inputPath = process.argv[2];
const outputPath = process.argv[3];
const customAreaPath = process.argv[4] || projectConfig.default_area_path || `Soluciones\\TRB-CashManagement\\PRD-VALORES\\SCT-Valores NVA_APP`;
const customAssignedTo = process.argv[5] || projectConfig.default_assigned_to || `Montiel, Fernando Javier`;
const customIterationPath = process.argv[6] || projectConfig.default_iteration_path || `Soluciones\\PI 7\\PI7 - Sprint 4`;
const customPlatform = (process.argv[7] || 'Web').trim();
const featureTag = (process.argv[8] || projectConfig.default_feature_tag || 'qa_feature_echeq').trim();

if (!inputPath || !outputPath) {
    console.error("Usage: node convert_to_ado_csv.js <input_csv_path> <output_csv_path> [area_path] [assigned_to] [iteration_path] [platform]");
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
                // Ignore \r
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

function escapeCSVField(val) {
    if (val === undefined || val === null) return '""';
    const str = String(val);
    return `"${str.replace(/"/g, '""')}"`;
}

const fileData = fs.readFileSync(path.resolve(inputPath), 'utf8');
const rows = parseCSV(fileData);

if (rows.length < 2) {
    console.error("Error: Input CSV contains no data rows.");
    process.exit(1);
}

const header = rows[0].map(h => h.trim().toLowerCase());
const dataRows = rows.slice(1).filter(r => r.length > 1 && r.some(c => c.trim() !== ''));

const colIndex = {
    nombre: header.findIndex(h => h.includes('nombre') || h.includes('title')),
    objetivo: header.findIndex(h => h.includes('objetivo') || h.includes('descrip') || h.includes('summary')),
    precondiciones: header.findIndex(h => h.includes('precondic')),
    pasos: header.findIndex(h => h.includes('paso') || h.includes('action')),
    resultado: header.findIndex(h => h.includes('resultado') || h.includes('expected')),
    prioridad: header.findIndex(h => h.includes('prioridad') || h.includes('priority')),
    complejidad: header.findIndex(h => h.includes('complejidad') || h.includes('complexity')),
    tipo: header.findIndex(h => h.includes('tipo') || h.includes('type')),
    camino: header.findIndex(h => h.includes('camino') || h.includes('path')),
    tags: header.findIndex(h => h.includes('tag'))
};

const adoHeader = [
    "ID",
    "Work Item Type",
    "Title",
    "Description",
    "BPrecondiciones",
    "BCaminoPrueba",
    "BTipoPrueba",
    "BPlataformaPrueba",
    "Test Step",
    "Step Action",
    "Step Expected",
    "Area Path",
    "Iteration Path",
    "Assigned To",
    "State",
    "BPrioridadTC",
    "BComplejidad",
    "Tags"
];

const outRows = [adoHeader.map(h => `"${h}"`).join(',')];

for (const row of dataRows) {
    const nombre = colIndex.nombre !== -1 ? row[colIndex.nombre].trim() : "Test Case";
    const objetivo = colIndex.objetivo !== -1 ? row[colIndex.objetivo].trim() : "";
    let precondiciones = colIndex.precondiciones !== -1 ? row[colIndex.precondiciones].trim() : "";
    precondiciones = precondiciones.replace(/(\r?\n)+/g, '; ').replace(/;\s*;/g, ';').replace(/^\d+\.\s*/gm, '').trim();

    const pasosRaw = colIndex.pasos !== -1 ? row[colIndex.pasos].trim() : "";
    const resultado = colIndex.resultado !== -1 ? row[colIndex.resultado].trim() : "";
    const prioridad = colIndex.prioridad !== -1 ? row[colIndex.prioridad].trim() : "1 - Alta";
    const complejidad = colIndex.complejidad !== -1 ? row[colIndex.complejidad].trim() : "2 - Media";
    const tipoPrueba = colIndex.tipo !== -1 ? row[colIndex.tipo].trim() : "0 - Funcional";
    const caminoPrueba = colIndex.camino !== -1 ? row[colIndex.camino].trim() : "Positivo";
    let tags = colIndex.tags !== -1 ? row[colIndex.tags].trim() : "";

    // Platform normalization
    const platformLabel = customPlatform.toLowerCase().includes('mob') ? 'Mobile' : 'Web';
    const platformTag = platformLabel === 'Mobile' ? 'QA_plataforma_mobile' : 'QA_plataforma_web';

    // Tag standardization
    let tagList = tags ? tags.split(';').map(t => t.trim()).filter(Boolean) : [];
    tagList = tagList.filter(t => !t.includes('sanity'));
    if (featureTag && !tagList.includes(featureTag)) tagList.unshift(featureTag);
    if (!tagList.includes(platformTag)) tagList.push(platformTag);
    const smokeTag = `${featureTag}_smoke`;
    const regTag = `${featureTag}_regression`;
    if ((tagList.includes(smokeTag) || nombre.startsWith('[R')) && !tagList.includes(regTag)) {
        tagList.push(regTag);
    }
    tags = tagList.join(';');

    // Split steps
    let pasosLines = pasosRaw.split(/\\n|\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (pasosLines.length === 0) {
        pasosLines = [pasosRaw || 'Realizar la acción de prueba'];
    }

    if (pasosLines.length === 1) {
        const step1Action = pasosLines[0].replace(/^(Step Action:\s*|Paso\s*\d+:\s*|\d+[\.\)]\s*)/i, '').trim();
        pasosLines = [
            step1Action,
            `Verificar la pantalla y resultado de la operación.`
        ];
    }

    const numSteps = pasosLines.length;

    // Fila 1: SOLO METADATOS (Test Step, Step Action, Step Expected quedan vacíos)
    const metadataRecord = [
        "", // ID
        "Test Case", // Work Item Type
        nombre,
        objetivo,
        precondiciones,
        caminoPrueba,
        tipoPrueba,
        platformLabel,
        "", // Test Step
        "", // Step Action
        "", // Step Expected
        customAreaPath,
        customIterationPath,
        customAssignedTo,
        "Design",
        prioridad,
        complejidad,
        tags
    ];
    outRows.push(metadataRecord.map(escapeCSVField).join(','));

    // Filas 2+: SOLO PASOS (Metadatos vacíos)
    for (let stepIdx = 0; stepIdx < numSteps; stepIdx++) {
        let rawStep = pasosLines[stepIdx];
        let action = rawStep.replace(/^(Step Action:\s*|Paso\s*\d+:\s*|\d+[\.\)]\s*)/i, '').trim();

        let expected = "";
        if (stepIdx === numSteps - 1) {
            expected = resultado ? resultado.replace(/^(Step Expected:\s*|Resultado Esperado:\s*)/i, '').trim() : "Operación finalizada según especificación funcional.";
        } else {
            expected = "El sistema responde visualmente y permite continuar al siguiente paso.";
        }

        const stepRecord = [
            "", // ID
            "", // Work Item Type
            "", // Title
            "", // Description
            "", // BPrecondiciones
            "", // BCaminoPrueba
            "", // BTipoPrueba
            "", // BPlataformaPrueba
            String(stepIdx + 1), // Test Step
            action, // Step Action
            expected, // Step Expected
            "", // Area Path
            "", // Iteration Path
            "", // Assigned To
            "", // State
            "", // BPrioridadTC
            "", // BComplejidad
            ""  // Tags
        ];
        outRows.push(stepRecord.map(escapeCSVField).join(','));
    }
}

const outDir = path.dirname(path.resolve(outputPath));
if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(path.resolve(outputPath), outRows.join('\r\n'), 'utf8');
console.log(JSON.stringify({
    status: 'SUCCESS',
    cases_processed: dataRows.length,
    output_rows: outRows.length,
    output_path: outputPath
}, null, 2));
