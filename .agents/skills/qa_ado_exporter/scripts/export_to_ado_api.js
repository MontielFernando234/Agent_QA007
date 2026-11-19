#!/usr/bin/env node
/**
 * Helper script for qa_ado_exporter:
 * - Parses functional test cases CSV from qa_designer.
 * - Converts multi-step testing procedures into Azure DevOps XML format (<steps id="0" last="N">...</steps>).
 * - Builds JSON Patch payloads conforming to Azure DevOps Work Item API ($Test Case).
 * - Creates Test Cases via Azure DevOps REST API (using PAT in mcp_config.json or environment) or outputs payloads for inspection.
 * - Links created Test Cases to the parent User Story (Microsoft.VSTS.Common.TestedBy-Reverse).
 * - Updates input/index.json and generates export_summary_<ID_HU>.md.
 *
 * Commands:
 *   node export_to_ado_api.js prepare --csv <path> --hu-id <ID> [--platform <web|mobile>] [--output <path>]
 *   node export_to_ado_api.js execute --payloads <path> --hu-id <ID> [--org <org>] [--project <project>]
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const WORKSPACE_ROOT = process.cwd();
const INPUT_DIR = path.join(WORKSPACE_ROOT, 'input');
const INDEX_JSON_PATH = path.join(INPUT_DIR, 'index.json');

function loadProjectConfig() {
    const configPath = path.join(WORKSPACE_ROOT, 'qa.config.json');
    if (fs.existsSync(configPath)) {
        try {
            return JSON.parse(fs.readFileSync(configPath, 'utf8'));
        } catch (e) {
            // Fallback
        }
    }
    return {};
}

const PROJECT_CONFIG = loadProjectConfig();

function parseArgs(argv) {
    const args = { _: [] };
    for (let i = 2; i < argv.length; i++) {
        const token = argv[i];
        if (token.startsWith('--')) {
            const key = token.slice(2);
            const next = argv[i + 1];
            if (next && !next.startsWith('--')) {
                args[key] = next;
                i++;
            } else {
                args[key] = true;
            }
        } else {
            args._.push(token);
        }
    }
    return args;
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

function escapeXml(unsafe) {
    if (!unsafe) return '';
    return String(unsafe).replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case "'": return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}

function formatStepTextToXml(text) {
    const htmlContent = String(text || '')
        .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
        .replace(/\*(.+?)\*/g, '<i>$1</i>')
        .replace(/__(.+?)__/g, '<u>$1</u>')
        .replace(/`(.+?)`/g, '<code>$1</code>')
        .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2">$1</a>');
    return escapeXml(htmlContent);
}

/**
 * Converts test steps array into Azure DevOps native XML structure for Microsoft.VSTS.TCM.Steps
 */
function convertStepsToAdoXml(steps) {
    let xml = `<steps id="0" last="${steps.length}">`;
    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const actionXml = formatStepTextToXml(step.action);
        const expectedXml = formatStepTextToXml(step.expected);
        xml += `\n  <step id="${i + 1}" type="ActionStep">\n    <parameterizedString isformatted="true">${actionXml}</parameterizedString>\n    <parameterizedString isformatted="true">${expectedXml}</parameterizedString>\n  </step>`;
    }
    xml += '\n</steps>';
    return xml;
}

function getStoredPat() {
    if (process.env.PERSONAL_ACCESS_TOKEN) {
        return process.env.PERSONAL_ACCESS_TOKEN;
    }
    // Try reading ~/.gemini/config/mcp_config.json
    try {
        const homeDir = process.env.USERPROFILE || process.env.HOME;
        const configPath = path.join(homeDir, '.gemini', 'config', 'mcp_config.json');
        if (fs.existsSync(configPath)) {
            const raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            const adoConfig = raw.mcpServers && (raw.mcpServers['azure-devops'] || raw.mcpServers['ado']);
            if (adoConfig && adoConfig.env && adoConfig.env.PERSONAL_ACCESS_TOKEN) {
                const b64 = adoConfig.env.PERSONAL_ACCESS_TOKEN;
                // If it is base64 encoded :token, decode it
                if (b64.startsWith('Ok') || b64.includes('==')) {
                    const decoded = Buffer.from(b64, 'base64').toString('utf8');
                    const parts = decoded.split(':');
                    return parts.length > 1 ? parts.slice(1).join(':') : decoded;
                }
                return b64;
            }
        }
    } catch (e) {
        // Fallback
    }
    return null;
}

function sendAdoRequest(org, project, apiPath, method, body, pat) {
    return new Promise((resolve, reject) => {
        const authValue = Buffer.from(':' + pat).toString('base64');
        const postData = body ? JSON.stringify(body) : '';
        const options = {
            hostname: 'dev.azure.com',
            port: 443,
            path: `/${encodeURIComponent(org)}/${encodeURIComponent(project)}/_apis/${apiPath}`,
            method: method,
            headers: {
                'Authorization': `Basic ${authValue}`,
                'Content-Type': method === 'PATCH' || method === 'POST' ? 'application/json-patch+json' : 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'User-Agent': 'Antigravity-QA-ADO-Exporter'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        resolve(data);
                    }
                } else {
                    reject(new Error(`Azure DevOps API error (${res.statusCode}): ${data}`));
                }
            });
        });

        req.on('error', err => reject(err));
        if (postData) {
            req.write(postData);
        }
        req.end();
    });
}

function cmdPrepare(args) {
    const csvPath = args.csv;
    const huId = String(args['hu-id'] || '');
    const platform = (args.platform || 'mobile').toLowerCase();
    const org = args.org || PROJECT_CONFIG.organization || 'BancorDigital';
    const project = args.project || PROJECT_CONFIG.project || 'Soluciones';
    const featureTag = args['feature-tag'] || PROJECT_CONFIG.default_feature_tag || 'qa_feature_echeq';
    const outputPath = args.output || `output/testCases/ado_payloads_${huId}.json`;

    if (!csvPath || !huId) {
        console.error('Usage: node export_to_ado_api.js prepare --csv <input_csv> --hu-id <ID_HU> [--platform <web|mobile>] [--output <path>]');
        process.exit(1);
    }

    const fileContent = fs.readFileSync(path.resolve(csvPath), 'utf8');
    const rows = parseCSV(fileContent);
    if (rows.length < 2) {
        console.error('Error: CSV file contains no data.');
        process.exit(1);
    }

    const header = rows[0].map(h => h.trim().toLowerCase());
    const dataRows = rows.slice(1).filter(r => r.length > 1 && r.some(c => c.trim() !== ''));

    const colIndex = {
        nombre: header.findIndex(h => h.includes('nombre') || h.includes('title')),
        objetivo: header.findIndex(h => h.includes('objetivo') || h.includes('descrip')),
        precondiciones: header.findIndex(h => h.includes('precondic')),
        pasos: header.findIndex(h => h.includes('paso') || h.includes('action')),
        resultado: header.findIndex(h => h.includes('resultado') || h.includes('expected')),
        prioridad: header.findIndex(h => h.includes('prioridad') || h.includes('priority')),
        complejidad: header.findIndex(h => h.includes('complejidad') || h.includes('complexity')),
        tipo: header.findIndex(h => h.includes('tipo') || h.includes('type')),
        camino: header.findIndex(h => h.includes('camino') || h.includes('path')),
        tags: header.findIndex(h => h.includes('tag'))
    };

    // Load HU info if available in index.json
    let areaPath = PROJECT_CONFIG.default_area_path || 'Soluciones\\TRB-CashManagement\\PRD-VALORES\\SCT-Valores NVA_APP';
    let iterationPath = PROJECT_CONFIG.default_iteration_path || 'Soluciones\\PI 7\\PI7 - Sprint 4';
    let assignedTo = PROJECT_CONFIG.default_assigned_to || 'Montiel, Fernando Javier';
    if (fs.existsSync(INDEX_JSON_PATH)) {
        try {
            const index = JSON.parse(fs.readFileSync(INDEX_JSON_PATH, 'utf8'));
            const hu = index.user_stories[huId];
            if (hu) {
                if (hu.area_path) areaPath = hu.area_path;
                if (hu.iteration_path) iterationPath = hu.iteration_path;
                if (hu.assigned_to) assignedTo = hu.assigned_to;
            }
        } catch (e) {
            // Use defaults
        }
    }

    const isMobile = platform.includes('mob');
    const platformLabel = isMobile ? 'Mobile' : 'Web';
    const platformTag = isMobile ? 'QA_plataforma_mobile' : 'QA_plataforma_web';

    const testCasePayloads = [];

    for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const title = colIndex.nombre !== -1 ? row[colIndex.nombre].trim() : `Test Case ${i + 1}`;
        const description = colIndex.objetivo !== -1 ? row[colIndex.objetivo].trim() : '';
        let precondiciones = colIndex.precondiciones !== -1 ? row[colIndex.precondiciones].trim() : '';
        precondiciones = precondiciones.replace(/(\r?\n)+/g, '; ').replace(/;\s*;/g, ';').trim();

        const prioridadRaw = colIndex.prioridad !== -1 ? row[colIndex.prioridad].trim() : '1 - Alta';
        const numPriorityMatch = /^\d+/.exec(prioridadRaw);
        const numPriority = numPriorityMatch ? parseInt(numPriorityMatch[0], 10) : 1;

        const complejidad = colIndex.complejidad !== -1 ? row[colIndex.complejidad].trim() : '2 - Media';
        const tipoPrueba = colIndex.tipo !== -1 ? row[colIndex.tipo].trim() : '0 - Funcional';
        const caminoPrueba = colIndex.camino !== -1 ? row[colIndex.camino].trim() : 'Positivo';
        const rawTags = colIndex.tags !== -1 ? row[colIndex.tags].trim() : '';

        let tagList = rawTags ? rawTags.split(';').map(t => t.trim()).filter(Boolean) : [];
        tagList = tagList.filter(t => !t.includes('sanity'));
        if (featureTag && !tagList.includes(featureTag)) tagList.unshift(featureTag);
        if (!tagList.includes(platformTag)) tagList.push(platformTag);
        const smokeTag = `${featureTag}_smoke`;
        const regTag = `${featureTag}_regression`;
        if ((tagList.includes(smokeTag) || title.startsWith('[R')) && !tagList.includes(regTag)) {
            tagList.push(regTag);
        }
        const tags = tagList.join(';');

        // Build atomic steps
        const pasosRaw = colIndex.pasos !== -1 ? row[colIndex.pasos].trim() : '';
        const resultado = colIndex.resultado !== -1 ? row[colIndex.resultado].trim() : '';
        let stepLines = pasosRaw.split(/\\n|\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
        if (stepLines.length === 0) stepLines = ['Realizar acción de prueba'];
        if (stepLines.length === 1) {
            stepLines.push('Verificar el resultado de la operación en pantalla.');
        }

        const steps = stepLines.map((line, sIdx) => {
            const action = line.replace(/^(Step Action:\s*|Paso\s*\d+:\s*|\d+[\.\)]\s*)/i, '').trim();
            const expected = sIdx === stepLines.length - 1
                ? (resultado ? resultado.replace(/^(Step Expected:\s*|Resultado Esperado:\s*)/i, '').trim() : 'Operación finalizada según especificación funcional.')
                : 'El sistema responde visualmente y permite continuar al siguiente paso.';
            return { action, expected };
        });

        const stepsXml = convertStepsToAdoXml(steps);

        const patchDocument = [
            { op: 'add', path: '/fields/System.Title', value: title },
            { op: 'add', path: '/fields/System.Description', value: description },
            { op: 'add', path: '/fields/System.AreaPath', value: areaPath },
            { op: 'add', path: '/fields/System.IterationPath', value: iterationPath },
            { op: 'add', path: '/fields/System.AssignedTo', value: assignedTo },
            { op: 'add', path: '/fields/System.State', value: 'Design' },
            { op: 'add', path: '/fields/Microsoft.VSTS.Common.Priority', value: numPriority },
            { op: 'add', path: '/fields/Custom.BPrioridadTC', value: prioridadRaw },
            { op: 'add', path: '/fields/Custom.BComplejidad', value: complejidad },
            { op: 'add', path: '/fields/Custom.BCaminoPrueba', value: caminoPrueba },
            { op: 'add', path: '/fields/Custom.BTipoPrueba', value: tipoPrueba },
            { op: 'add', path: '/fields/Custom.BPlataformaPrueba', value: platformLabel },
            { op: 'add', path: '/fields/Custom.BPrecondiciones', value: precondiciones },
            { op: 'add', path: '/fields/System.Tags', value: tags },
            { op: 'add', path: '/fields/Microsoft.VSTS.TCM.Steps', value: stepsXml },
            {
                op: 'add',
                path: '/relations/-',
                value: {
                    rel: 'Microsoft.VSTS.Common.TestedBy-Reverse',
                    url: `https://dev.azure.com/${encodeURIComponent(org)}/${encodeURIComponent(project)}/_apis/wit/workItems/${huId}`,
                    attributes: { comment: `Vinculado a User Story #${huId}` }
                }
            }
        ];

        testCasePayloads.push({
            case_index: i + 1,
            title,
            num_steps: steps.length,
            steps,
            steps_xml_preview: stepsXml,
            patchDocument
        });
    }

    const outputData = {
        generated_at: new Date().toISOString(),
        hu_id: Number(huId),
        platform: platformLabel,
        total_cases: testCasePayloads.length,
        area_path: areaPath,
        iteration_path: iterationPath,
        cases: testCasePayloads
    };

    const outDir = path.dirname(path.resolve(outputPath));
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.resolve(outputPath), JSON.stringify(outputData, null, 2), 'utf8');

    console.log(JSON.stringify({
        status: 'SUCCESS',
        hu_id: Number(huId),
        cases_prepared: testCasePayloads.length,
        output_file: outputPath,
        sample_steps_xml: testCasePayloads[0]?.steps_xml_preview
    }, null, 2));
}

async function cmdExecute(args) {
    const payloadsPath = args.payloads;
    const huId = String(args['hu-id'] || '');
    const org = args.org || PROJECT_CONFIG.organization || 'BancorDigital';
    const project = args.project || PROJECT_CONFIG.project || 'Soluciones';

    if (!payloadsPath || !huId) {
        console.error('Usage: node export_to_ado_api.js execute --payloads <payloads_json> --hu-id <ID_HU> [--org <org>] [--project <project>]');
        process.exit(1);
    }

    const pat = getStoredPat();
    if (!pat) {
        console.error('Error: Could not retrieve Azure DevOps PAT from environment or mcp_config.json');
        process.exit(1);
    }

    const rawData = JSON.parse(fs.readFileSync(path.resolve(payloadsPath), 'utf8'));
    const cases = rawData.cases || [];
    if (cases.length === 0) {
        console.error('Error: Payloads file has 0 cases.');
        process.exit(1);
    }

    console.log(`Starting export of ${cases.length} Test Cases to Azure DevOps (${org}/${project})...`);
    const createdCases = [];

    for (const tc of cases) {
        try {
            const apiPath = `wit/workitems/$Test%20Case?api-version=7.0`;
            const created = await sendAdoRequest(org, project, apiPath, 'POST', tc.patchDocument, pat);
            console.log(`Created Test Case #${created.id}: ${created.fields['System.Title']}`);
            createdCases.push({
                index: tc.case_index,
                id: created.id,
                title: created.fields['System.Title'],
                url: created._links?.html?.href || `https://dev.azure.com/${org}/${project}/_workitems/edit/${created.id}`
            });
        } catch (err) {
            console.error(`Failed to create case "${tc.title}":`, err.message);
            createdCases.push({
                index: tc.case_index,
                id: null,
                title: tc.title,
                error: err.message
            });
        }
    }

    // Generate Export Summary Markdown
    const summaryMd = `# Resumen de Exportación de Casos de Prueba a Azure DevOps

> **Ejecutado por \`qa_ado_exporter\`** — Sincronización automatizada por API/MCP de Azure DevOps.

---

## 1. Datos Generales de la Exportación

| Atributo | Valor |
| :--- | :--- |
| **User Story Padre** | \`#${huId}\` |
| **Organización / Proyecto** | \`${org}\` / \`${project}\` |
| **Fecha de Exportación** | \`${new Date().toISOString()}\` |
| **Total Casos Procesados** | \`${cases.length}\` |
| **Creados Exitosamente** | \`${createdCases.filter(c => c.id).length}\` |
| **Fallidos** | \`${createdCases.filter(c => !c.id).length}\` |

---

## 2. Detalle de Test Cases Creados en Azure DevOps

| # | ID ADO | Título del Test Case | Enlace Directo | Estado |
|---|---|---|---|---|
${createdCases.map(c => `| ${c.index} | ${c.id ? `**#${c.id}**` : '❌'} | ${c.title} | ${c.id ? `[Abrir en ADO](${c.url})` : c.error} | ${c.id ? '✅ Creado' : '❌ Error'} |`).join('\n')}

---

## 3. Instrucciones de Verificación en Azure DevOps
1. Ingresar a la User Story en Azure DevOps: [User Story #${huId}](https://dev.azure.com/${org}/${project}/_workitems/edit/${huId}).
2. En la solapa **Links / Related Work**, verificar que los Test Cases aparecen vinculados con la relación \`Tested By\`.
3. Al abrir cualquiera de los Test Cases creados, comprobar que la solapa **Steps** muestra los pasos renderizados en la cuadrícula oficial de Azure DevOps.
`;

    const summaryPath = path.join(path.dirname(path.resolve(payloadsPath)), `export_summary_${huId}.md`);
    fs.writeFileSync(summaryPath, summaryMd, 'utf8');

    // Update input/index.json if present
    if (fs.existsSync(INDEX_JSON_PATH)) {
        try {
            const index = JSON.parse(fs.readFileSync(INDEX_JSON_PATH, 'utf8'));
            const hu = index.user_stories[huId];
            if (hu) {
                hu.test_case_ids = createdCases.filter(c => c.id).map(c => c.id);
                hu.export_summary_file = summaryPath.replace(/\\/g, '/');
                fs.writeFileSync(INDEX_JSON_PATH, JSON.stringify(index, null, 2), 'utf8');
            }
        } catch (e) {
            // Non-critical
        }
    }

    console.log(JSON.stringify({
        status: 'SUCCESS',
        hu_id: Number(huId),
        created_count: createdCases.filter(c => c.id).length,
        summary_file: summaryPath,
        created_cases: createdCases
    }, null, 2));
}

function main() {
    const args = parseArgs(process.argv);
    const command = args._[0];

    switch (command) {
        case 'prepare':
            cmdPrepare(args);
            break;
        case 'execute':
            cmdExecute(args);
            break;
        default:
            console.log('Commands: prepare | execute');
            process.exit(0);
    }
}

main();
