#!/usr/bin/env node
/**
 * Helper script for qa_ado_importer:
 * - Cleans Azure DevOps HTML (Description, Acceptance Criteria, Tables, Comments) into clean Markdown for qa_analytics.
 * - Extracts embedded attachment GUIDs and Figma URLs.
 * - Persists versioned User Stories (hu_<ID>_rev<REV>.md) and active working copy (hu_<ID>.md).
 * - Maintains the master index in input/index.json and input/INDEX.md for O(1) lookup by qa_analytics / qa_designer.
 *
 * Commands:
 *   node manage_ado_index.js check --id <ID_HU>
 *   node manage_ado_index.js find --query <ID_or_keyword>
 *   node manage_ado_index.js upsert-hu --json <wit_json_path> [--comments <comments_json_path>] --platform <web|mobile> --functionality <slug> [--parent-title <title>]
 *   node manage_ado_index.js upsert-feature --json <feature_json_path> --platform <web|mobile> --functionality <slug>
 *   node manage_ado_index.js rebuild-index
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE_ROOT = process.cwd();
const INPUT_DIR = path.join(WORKSPACE_ROOT, 'input');
const INDEX_JSON_PATH = path.join(INPUT_DIR, 'index.json');
const INDEX_MD_PATH = path.join(INPUT_DIR, 'INDEX.md');

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

/**
 * Strips MCP untrusted content banners if present in saved tool output files
 */
function parseMcpJsonFile(filePath) {
    const raw = fs.readFileSync(filePath, 'utf8');
    const firstBrace = raw.indexOf('{');
    const lastBrace = raw.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) {
        throw new Error(`No valid JSON object found in ${filePath}`);
    }
    return JSON.parse(raw.slice(firstBrace, lastBrace + 1));
}

function decodeHtmlEntities(str) {
    if (!str) return '';
    return str
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
}

/**
 * Extracts attachment URLs/GUIDs and Figma links from raw HTML strings
 */
function extractAssetsFromHtml(htmlStrings) {
    const attachments = new Map();
    const figmaLinks = new Set();

    const attachmentRegex = /https:\/\/dev\.azure\.com\/[^"'\s>]+\/_apis\/wit\/attachments\/([0-9a-fA-F-]+)(?:\?fileName=([^"'\s&>]+))?/g;
    const figmaRegex = /https:\/\/(?:www\.)?figma\.com\/(?:design|file|proto|board)\/[^\s"'<>)]+/g;

    for (const html of htmlStrings) {
        if (!html) continue;
        let match;
        while ((match = attachmentRegex.exec(html)) !== null) {
            const guid = match[1];
            const fileName = decodeURIComponent(match[2] || 'attachment.png');
            const localName = `${guid.slice(0, 8)}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
            attachments.set(guid, {
                guid,
                fileName,
                localName,
                url: match[0]
            });
        }
        while ((match = figmaRegex.exec(html)) !== null) {
            figmaLinks.add(decodeHtmlEntities(match[0]));
        }
    }

    return {
        attachments: Array.from(attachments.values()),
        figmaLinks: Array.from(figmaLinks)
    };
}

/**
 * Converts HTML tables to Markdown tables and cleans general ADO HTML into readable Markdown
 */
function htmlToMarkdown(html) {
    if (!html || typeof html !== 'string') return '_Sin contenido especificado en ADO._';

    let text = html;

    // Replace embedded ADO attachment <img> tags with clear Markdown image reference
    text = text.replace(
        /<img[^>]*src=["']https:\/\/dev\.azure\.com\/[^"']+\/_apis\/wit\/attachments\/([0-9a-fA-F-]+)(?:\?fileName=([^"'&>]+))?[^"']*["'][^>]*>/gi,
        (_, guid, fileName) => {
            const cleanName = decodeURIComponent(fileName || 'image.png').replace(/[^a-zA-Z0-9._-]/g, '_');
            const localName = `${guid.slice(0, 8)}_${cleanName}`;
            return `\n![Adjunto ADO: ${localName}](./attachments/${localName})\n`;
        }
    );

    // Convert HTML tables into Markdown tables
    text = text.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (_, tableInner) => {
        const rows = [];
        const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
        let trMatch;
        while ((trMatch = trRegex.exec(tableInner)) !== null) {
            const rowContent = trMatch[1];
            const cells = [];
            const cellRegex = /<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi;
            let cellMatch;
            while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
                let cellMd = htmlFragmentToInlineText(cellMatch[1]);
                cells.push(cellMd || ' ');
            }
            if (cells.length > 0) {
                rows.push(cells);
            }
        }
        if (rows.length === 0) return '';
        const colCount = Math.max(...rows.map(r => r.length));
        const normalizedRows = rows.map(r => {
            while (r.length < colCount) r.push(' ');
            return r.map(c => c.replace(/\|/g, '\\|').replace(/\r?\n+/g, '<br>').trim());
        });

        const header = `| ${normalizedRows[0].join(' | ')} |`;
        const separator = `| ${normalizedRows[0].map(() => '---').join(' | ')} |`;
        const body = normalizedRows.slice(1).map(r => `| ${r.join(' | ')} |`).join('\n');
        return `\n\n${header}\n${separator}\n${body}\n\n`;
    });

    return htmlFragmentToBlockMarkdown(text);
}

function htmlFragmentToInlineText(html) {
    let s = html || '';
    s = s.replace(/<br\s*\/?>/gi, ' ');
    s = s.replace(/<\/p>/gi, ' ');
    s = s.replace(/<\/div>/gi, ' ');
    s = s.replace(/<li[^>]*>/gi, ' • ');
    s = s.replace(/<(?:strong|b)[^>]*>([\s\S]*?)<\/(?:strong|b)>/gi, '**$1**');
    s = s.replace(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');
    s = s.replace(/<[^>]+>/g, '');
    s = decodeHtmlEntities(s);
    return s.replace(/\s+/g, ' ').trim();
}

function htmlFragmentToBlockMarkdown(html) {
    let s = html || '';
    s = s.replace(/<hr\s*\/?>/gi, '\n\n---\n\n');
    s = s.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n\n### $1\n');
    s = s.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n\n#### $1\n');
    s = s.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n\n#### $1\n');
    s = s.replace(/<h[4-6][^>]*>([\s\S]*?)<\/h[4-6]>/gi, '\n\n##### $1\n');
    s = s.replace(/<(?:strong|b)[^>]*>([\s\S]*?)<\/(?:strong|b)>/gi, '**$1**');
    s = s.replace(/<(?:em|i)[^>]*>([\s\S]*?)<\/(?:em|i)>/gi, '*$1*');
    s = s.replace(/<u[^>]*>([\s\S]*?)<\/u>/gi, '**$1**');
    s = s.replace(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_, href, label) => {
        const cleanLabel = label.replace(/<[^>]+>/g, '').trim();
        if (href === '#') return cleanLabel;
        return `[${cleanLabel || href}](${href})`;
    });
    s = s.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, inner) => {
        const cleaned = inner.replace(/<\/?(?:p|div|span)[^>]*>/gi, ' ').trim();
        return `\n- ${cleaned}`;
    });
    s = s.replace(/<br\s*\/?>/gi, '\n');
    s = s.replace(/<\/(?:p|div|ul|ol)>/gi, '\n');
    s = s.replace(/<[^>]+>/g, '');
    s = decodeHtmlEntities(s);

    // Clean excessive blank lines and trailing spaces
    s = s
        .split(/\r?\n/)
        .map(line => line.replace(/[ \t]+$/g, ''))
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

    // Fix bold markers around spaces like "**Texto **"
    s = s.replace(/\*\*\s+([^*]+?)\s+\*\*/g, '**$1**');
    return s || '_Sin contenido especificado en ADO._';
}

function loadIndex() {
    if (fs.existsSync(INDEX_JSON_PATH)) {
        try {
            return JSON.parse(fs.readFileSync(INDEX_JSON_PATH, 'utf8'));
        } catch (e) {
            // Fall through to default
        }
    }
    return {
        schema_version: '1.0.0',
        last_updated: new Date().toISOString(),
        organization: 'BancorDigital',
        project: 'Soluciones',
        stats: {
            total_features: 0,
            total_user_stories: 0,
            by_platform: { mobile: 0, web: 0 }
        },
        features: {},
        user_stories: {}
    };
}

function saveIndex(index) {
    fs.mkdirSync(INPUT_DIR, { recursive: true });
    index.last_updated = new Date().toISOString();

    const stories = Object.values(index.user_stories || {});
    const features = Object.values(index.features || {});
    index.stats = {
        total_features: features.length,
        total_user_stories: stories.length,
        by_platform: {
            mobile: stories.filter(s => s.platform === 'mobile').length,
            web: stories.filter(s => s.platform === 'web').length
        }
    };

    fs.writeFileSync(INDEX_JSON_PATH, JSON.stringify(index, null, 2), 'utf8');
    generateIndexMarkdown(index);
}

function generateIndexMarkdown(index) {
    const features = Object.values(index.features || {});
    const stories = Object.values(index.user_stories || {});

    let md = `# Índice Maestro de Insumos QA (\`input/\`)\n\n`;
    md += `> **Actualizado automáticamente por \`qa_ado_importer\`:** \`${index.last_updated}\`  \n`;
    md += `> **Propósito:** Permitir a \`qa_analytics\` y \`qa_designer\` localizar instantáneamente la versión activa de cada Historia de Usuario sin re-consultar el MCP de Azure DevOps.\n\n`;
    md += `---\n\n`;
    md += `## 1. Resumen Estadístico\n\n`;
    md += `- **Features Indexadas:** ${index.stats.total_features}\n`;
    md += `- **Historias de Usuario Persistidas:** ${index.stats.total_user_stories} (Mobile: ${index.stats.by_platform.mobile} | Web: ${index.stats.by_platform.web})\n\n`;
    md += `---\n\n`;

    md += `## 2. Catálogo de Features\n\n`;
    if (features.length === 0) {
        md += `_No hay Features registradas aún._\n\n`;
    } else {
        md += `| ID Feature | Plataforma | Funcionalidad | Título | Estado ADO | Rev ADO | HUs Hijas | Archivo Contexto |\n`;
        md += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;
        for (const f of features) {
            md += `| **${f.id}** | \`${f.platform}\` | \`${f.functionality}\` | ${f.title} | ${f.state} | \`rev ${f.ado_rev}\` | ${(f.child_user_stories || []).length} | [${path.basename(f.context_file)}](./${f.context_file.replace(/^input\//, '')}) |\n`;
        }
        md += `\n`;
    }

    md += `---\n\n`;
    md += `## 3. Catálogo de Historias de Usuario (User Stories)\n\n`;
    if (stories.length === 0) {
        md += `_No hay Historias de Usuario persistidas aún._\n\n`;
    } else {
        md += `| ID HU | Plataforma | Funcionalidad | Feature Padre | Título | Estado ADO | Rev Activa | Versiones Locales | Adjuntos ADO | Pantallas Figma | Archivo Activo |\n`;
        md += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;
        for (const s of stories) {
            const relLink = s.active_file ? s.active_file.replace(/^input\//, '') : '';
            const revs = (s.available_revs || [s.active_rev]).filter(Boolean).map(r => `rev${r}`).join(', ') || '-';
            const figmaCount = s.figma?.screens_count || 0;
            const figmaCell = figmaCount > 0 && s.figma?.context_file
                ? `[${figmaCount} pantallas](./${s.figma.context_file.replace(/^input\//, '')})`
                : '0';
            const activeCell = relLink ? `[hu_${s.id}.md](./${relLink})` : '_Pendiente ADO_';
            md += `| **${s.id}** | \`${s.platform}\` | \`${s.functionality}\` | ${s.parent_feature_id || '-'} | ${s.title || '-'} | ${s.state || '-'} | **\`rev ${s.active_rev || '-'}\`** | \`${revs}\` | ${s.attachments_count || 0} | ${figmaCell} | ${activeCell} |\n`;
        }
        md += `\n`;
    }

    fs.writeFileSync(INDEX_MD_PATH, md, 'utf8');
}

function cmdCheck(args) {
    const id = String(args.id || '');
    if (!id) {
        console.error('Error: --id <ID> is required');
        process.exit(1);
    }
    const index = loadIndex();
    const hu = index.user_stories[id];
    const feat = index.features[id];
    if (hu) {
        console.log(JSON.stringify({ found: true, type: 'User Story', entry: hu }, null, 2));
    } else if (feat) {
        console.log(JSON.stringify({ found: true, type: 'Feature', entry: feat }, null, 2));
    } else {
        console.log(JSON.stringify({ found: false, id }, null, 2));
    }
}

function cmdFind(args) {
    const q = String(args.query || args.id || '').toLowerCase();
    const index = loadIndex();
    const results = Object.values(index.user_stories).filter(s => {
        return (
            String(s.id) === q ||
            (s.title && s.title.toLowerCase().includes(q)) ||
            (s.functionality && s.functionality.toLowerCase().includes(q)) ||
            (s.platform && s.platform.toLowerCase().includes(q)) ||
            String(s.parent_feature_id) === q
        );
    });
    console.log(JSON.stringify({ count: results.length, results }, null, 2));
}

function cmdUpsertHu(args) {
    const jsonPath = args.json;
    const commentsPath = args.comments;
    const platform = (args.platform || '').toLowerCase();
    const functionality = (args.functionality || args['feature-slug'] || '').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    const parentTitle = args['parent-title'] || '';

    if (!jsonPath || !platform || !functionality) {
        console.error('Usage: node manage_ado_index.js upsert-hu --json <wit_json_path> [--comments <comments_json_path>] --platform <web|mobile> --functionality <slug>');
        process.exit(1);
    }

    const wit = parseMcpJsonFile(jsonPath);
    const commentsObj = commentsPath && fs.existsSync(commentsPath) ? parseMcpJsonFile(commentsPath) : { comments: [] };
    const fields = wit.fields || {};
    const id = wit.id || fields['System.Id'];
    const rev = wit.rev || fields['System.Rev'] || 1;
    const title = fields['System.Title'] || `HU ${id}`;
    const state = fields['System.State'] || 'Unknown';
    const boardColumn = fields['System.BoardColumn'] || state;
    const areaPath = fields['System.AreaPath'] || 'Soluciones';
    const iterationPath = fields['System.IterationPath'] || 'Soluciones';
    const assignedTo = fields['System.AssignedTo']?.displayName || 'Sin asignar';
    const createdBy = fields['System.CreatedBy']?.displayName || 'Desconocido';
    const createdDate = fields['System.CreatedDate'] || '';
    const changedBy = fields['System.ChangedBy']?.displayName || 'Desconocido';
    const changedDate = fields['System.ChangedDate'] || '';
    const tags = fields['System.Tags'] || 'Sin tags';
    const parentId = fields['System.Parent'] || null;
    const htmlUrl = wit._links?.html?.href || `https://dev.azure.com/BancorDigital/Soluciones/_workitems/edit/${id}`;

    const rawDesc = fields['System.Description'] || '';
    const rawCriteria = fields['Microsoft.VSTS.Common.AcceptanceCriteria'] || '';
    const commentsList = commentsObj.comments || [];

    const allHtmlStrings = [rawDesc, rawCriteria, ...commentsList.map(c => c.text || '')];
    const { attachments, figmaLinks } = extractAssetsFromHtml(allHtmlStrings);

    // Also inspect relations for AttachedFile or Child items
    const relations = wit.relations || [];
    const relatedItems = [];
    for (const rel of relations) {
        if (rel.rel === 'AttachedFile') {
            const guidMatch = /attachments\/([0-9a-fA-F-]+)/.exec(rel.url || '');
            if (guidMatch) {
                const guid = guidMatch[1];
                const fileName = rel.attributes?.name || 'attachment.bin';
                const localName = `${guid.slice(0, 8)}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
                if (!attachments.some(a => a.guid === guid)) {
                    attachments.push({ guid, fileName, localName, url: rel.url });
                }
            }
        } else if (rel.url && rel.url.includes('/workItems/')) {
            const witIdMatch = /\/workItems\/(\d+)/.exec(rel.url);
            if (witIdMatch) {
                relatedItems.push({
                    id: Number(witIdMatch[1]),
                    type: rel.attributes?.name || rel.rel,
                    url: rel.url
                });
            }
        }
    }

    const descMd = htmlToMarkdown(rawDesc);
    const criteriaMd = htmlToMarkdown(rawCriteria);

    let commentsMd = '_Sin comentarios en Azure DevOps._';
    if (commentsList.length > 0) {
        commentsMd = commentsList
            .map((c, idx) => {
                const author = c.createdBy?.displayName || 'Usuario';
                const date = c.createdDate || '';
                const body = htmlToMarkdown(c.text || '');
                return `##### Comentario #${idx + 1} — **${author}** (\`${date}\`)\n${body}`;
            })
            .join('\n\n---\n\n');
    }

    const figmaMd = figmaLinks.length > 0
        ? figmaLinks.map(l => `- [Diseño en Figma](${l})`).join('\n')
        : '_No se detectaron enlaces directos a Figma en el texto de la HU._';

    const attachmentsMd = attachments.length > 0
        ? attachments.map(a => `- \`attachments/${a.localName}\` (GUID: \`${a.guid}\`, original: \`${a.fileName}\`)`).join('\n')
        : '_Sin imágenes ni archivos adjuntos._';

    const relationsMd = relatedItems.length > 0
        ? relatedItems.map(r => `- **${r.type}:** Work Item \`#${r.id}\``).join('\n')
        : '_Sin relaciones adicionales._';

    const syncTimestamp = new Date().toISOString();

    const huDir = path.join(INPUT_DIR, platform, functionality, String(id));
    const versionsDir = path.join(huDir, 'versions');
    const rawDir = path.join(huDir, 'raw');
    const attachmentsDir = path.join(huDir, 'attachments');

    fs.mkdirSync(versionsDir, { recursive: true });
    fs.mkdirSync(rawDir, { recursive: true });
    fs.mkdirSync(attachmentsDir, { recursive: true });

    const markdownContent = `# Historia de Usuario ${id}: ${title}

> **Archivo Persistido por \`qa_ado_importer\`** — Fuente local indexada para \`qa_analytics\`. No requiere re-consultar el MCP de Azure DevOps.

---

## 1. Metadatos de Sincronización y Versionado (Azure DevOps)

| Atributo | Valor |
| :--- | :--- |
| **ID de HU** | \`${id}\` |
| **Revisión ADO Activa (\`System.Rev\`)** | \`rev ${rev}\` |
| **Estado en ADO (\`System.State\`)** | \`${state}\` (Columna: \`${boardColumn}\`) |
| **Plataforma** | \`${platform}\` |
| **Funcionalidad** | \`${functionality}\` |
| **Feature Padre** | ${parentId ? `\`${parentId}\`${parentTitle ? ` - ${parentTitle}` : ''}` : '_Sin Feature padre_'} |
| **Area Path** | \`${areaPath}\` |
| **Iteration Path (Sprint)** | \`${iterationPath}\` |
| **Asignado a** | ${assignedTo} |
| **Creado por** | ${createdBy} (\`${createdDate}\`) |
| **Última modificación en ADO** | \`${changedDate}\` por ${changedBy} |
| **Fecha de sincronización local** | \`${syncTimestamp}\` |
| **Tags ADO** | \`${tags}\` |
| **URL ADO** | [Abrir Work Item ${id} en Azure DevOps](${htmlUrl}) |

---

## 2. Insumo Estructurado para \`qa_analytics\` (ETAPA 1)

\`\`\`text
ID de HU: ${id}
Nombre HU: ${title}
Área: ${areaPath}
Plataforma: ${platform}
Funcionalidad: ${functionality}
Revisión ADO: rev ${rev}
\`\`\`

### 2.1 Descripción (\`System.Description\`)

${descMd}

---

### 2.2 Criterios de Aceptación (\`Microsoft.VSTS.Common.AcceptanceCriteria\`)

${criteriaMd}

---

### 2.3 Información Adicional, Comentarios e Insumos Visuales

#### Comentarios de Refinamiento en ADO (${commentsList.length} comentarios)

${commentsMd}

#### Enlaces a Figma Detectados

${figmaMd}

#### Imágenes y Adjuntos en la HU (${attachments.length} adjuntos)

${attachmentsMd}

#### Relaciones con Otros Work Items

${relationsMd}
`;

    const activeFilePath = path.join(huDir, `hu_${id}.md`);
    const versionFilePath = path.join(versionsDir, `hu_${id}_rev${rev}.md`);
    const rawSavePath = path.join(rawDir, `wit_${id}_rev${rev}.json`);

    fs.writeFileSync(versionFilePath, markdownContent, 'utf8');
    fs.writeFileSync(activeFilePath, markdownContent, 'utf8');
    fs.writeFileSync(rawSavePath, JSON.stringify({ wit, comments: commentsList }, null, 2), 'utf8');

    // Update Master Index
    const index = loadIndex();
    const existing = index.user_stories[String(id)] || {};
    const prevRevs = new Set(existing.available_revs || []);
    prevRevs.add(Number(rev));
    const versionFiles = existing.version_files || {};
    versionFiles[String(rev)] = `input/${platform}/${functionality}/${id}/versions/hu_${id}_rev${rev}.md`;

    index.user_stories[String(id)] = {
        id: Number(id),
        title,
        platform,
        functionality,
        parent_feature_id: parentId ? Number(parentId) : null,
        state,
        area_path: areaPath,
        iteration_path: iterationPath,
        assigned_to: assignedTo,
        tags,
        active_rev: Number(rev),
        available_revs: Array.from(prevRevs).sort((a, b) => a - b),
        ado_changed_date: changedDate,
        ado_changed_by: changedBy,
        last_synced: syncTimestamp,
        folder_path: `input/${platform}/${functionality}/${id}`,
        active_file: `input/${platform}/${functionality}/${id}/hu_${id}.md`,
        version_files: versionFiles,
        raw_file: `input/${platform}/${functionality}/${id}/raw/wit_${id}_rev${rev}.json`,
        attachments_dir: `input/${platform}/${functionality}/${id}/attachments`,
        attachments_count: attachments.length,
        attachments_to_download: attachments,
        figma_links: figmaLinks,
        figma: existing.figma || null
    };

    saveIndex(index);

    console.log(JSON.stringify({
        status: 'SUCCESS',
        id: Number(id),
        active_rev: Number(rev),
        active_file: `input/${platform}/${functionality}/${id}/hu_${id}.md`,
        version_file: `input/${platform}/${functionality}/${id}/versions/hu_${id}_rev${rev}.md`,
        attachments_to_download: attachments,
        figma_links: figmaLinks
    }, null, 2));
}

function cmdUpsertFeature(args) {
    const jsonPath = args.json;
    const platform = (args.platform || '').toLowerCase();
    const functionality = (args.functionality || args['feature-slug'] || '').toLowerCase().replace(/[^a-z0-9_-]/g, '_');

    if (!jsonPath || !platform || !functionality) {
        console.error('Usage: node manage_ado_index.js upsert-feature --json <feature_json_path> --platform <web|mobile> --functionality <slug>');
        process.exit(1);
    }

    const wit = parseMcpJsonFile(jsonPath);
    const fields = wit.fields || {};
    const id = wit.id || fields['System.Id'];
    const rev = wit.rev || fields['System.Rev'] || 1;
    const title = fields['System.Title'] || `Feature ${id}`;
    const state = fields['System.State'] || 'Unknown';
    const areaPath = fields['System.AreaPath'] || 'Soluciones';
    const iterationPath = fields['System.IterationPath'] || 'Soluciones';
    const assignedTo = fields['System.AssignedTo']?.displayName || 'Sin asignar';
    const changedBy = fields['System.ChangedBy']?.displayName || 'Desconocido';
    const changedDate = fields['System.ChangedDate'] || '';
    const tags = fields['System.Tags'] || 'Sin tags';
    const htmlUrl = wit._links?.html?.href || `https://dev.azure.com/BancorDigital/Soluciones/_workitems/edit/${id}`;

    const childIds = [];
    for (const rel of wit.relations || []) {
        if (rel.rel === 'System.LinkTypes.Hierarchy-Forward' && rel.url) {
            const m = /\/workItems\/(\d+)/.exec(rel.url);
            if (m) childIds.push(Number(m[1]));
        }
    }

    const descMd = htmlToMarkdown(fields['System.Description'] || '');
    const syncTimestamp = new Date().toISOString();
    const featureDir = path.join(INPUT_DIR, platform, functionality);
    fs.mkdirSync(featureDir, { recursive: true });

    const index = loadIndex();

    const childRows = childIds.map(cid => {
        const localHu = index.user_stories[String(cid)];
        if (localHu) {
            return `| \`${cid}\` | ${localHu.title} | ${localHu.state} | \`rev ${localHu.active_rev}\` | ✅ Persistida | [${localHu.active_file}](../../../${localHu.active_file}) |`;
        }
        return `| \`${cid}\` | _(Pendiente de importar)_ | - | - | 🆕 No importada | - |`;
    }).join('\n');

    const featureMd = `# Feature ${id}: ${title}

> **Contexto Macro de Feature Persistido por \`qa_ado_importer\`**

---

## 1. Metadatos de la Feature

| Atributo | Valor |
| :--- | :--- |
| **ID Feature** | \`${id}\` |
| **Título** | ${title} |
| **Revisión ADO (\`System.Rev\`)** | \`rev ${rev}\` |
| **Estado en ADO** | \`${state}\` |
| **Plataforma** | \`${platform}\` |
| **Funcionalidad** | \`${functionality}\` |
| **Area Path** | \`${areaPath}\` |
| **Iteration Path** | \`${iterationPath}\` |
| **Asignado a** | ${assignedTo} |
| **Tags ADO** | \`${tags}\` |
| **Última modificación en ADO** | \`${changedDate}\` por ${changedBy} |
| **Fecha de sincronización local** | \`${syncTimestamp}\` |
| **URL ADO** | [Abrir Feature ${id} en Azure DevOps](${htmlUrl}) |

---

## 2. Descripción y Alcance de la Feature

${descMd}

---

## 3. Mapa de Work Items Hijos Asociados (${childIds.length} ítems)

| ID Hijo | Título | Estado ADO | Rev Local | Estado Sincronización | Ruta Local Activa |
| :--- | :--- | :--- | :--- | :--- | :--- |
${childRows || '| - | _Sin hijos asociados_ | - | - | - | - |'}
`;

    const contextFilePath = path.join(featureDir, `feature_${id}.md`);
    fs.writeFileSync(contextFilePath, featureMd, 'utf8');

    index.features[String(id)] = {
        id: Number(id),
        title,
        platform,
        functionality,
        state,
        ado_rev: Number(rev),
        ado_changed_date: changedDate,
        last_synced: syncTimestamp,
        context_file: `input/${platform}/${functionality}/feature_${id}.md`,
        child_user_stories: childIds
    };

    saveIndex(index);

    console.log(JSON.stringify({
        status: 'SUCCESS',
        feature_id: Number(id),
        context_file: `input/${platform}/${functionality}/feature_${id}.md`,
        child_ids: childIds
    }, null, 2));
}

function cmdCheckFigma(args) {
    const id = String(args.id || '');
    const platform = (args.platform || '').toLowerCase();
    const functionality = (args.functionality || '').toLowerCase().replace(/[^a-z0-9_-]/g, '_');

    const index = loadIndex();
    const hu = index.user_stories[id];

    const resolvedPlatform = platform || hu?.platform || '';
    const resolvedFunc = functionality || hu?.functionality || '';

    if (!id || !resolvedPlatform || !resolvedFunc) {
        console.log(JSON.stringify({
            has_existing_figma: false,
            message: 'HU no indexada aún o faltan parámetros --platform y --functionality',
            indexed_hu: hu || null
        }, null, 2));
        return;
    }

    const figmaDir = path.join(INPUT_DIR, resolvedPlatform, resolvedFunc, id, 'figma');
    const screensDir = path.join(figmaDir, 'screens');
    const manifestPath = path.join(figmaDir, 'figma_manifest.json');

    let existingScreens = [];
    if (fs.existsSync(screensDir)) {
        existingScreens = fs.readdirSync(screensDir).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));
    }

    let manifest = null;
    if (fs.existsSync(manifestPath)) {
        try {
            manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        } catch (e) {
            manifest = null;
        }
    }

    console.log(JSON.stringify({
        id: Number(id),
        platform: resolvedPlatform,
        functionality: resolvedFunc,
        has_existing_figma: existingScreens.length > 0 || !!manifest,
        figma_dir: `input/${resolvedPlatform}/${resolvedFunc}/${id}/figma`,
        existing_screens_count: existingScreens.length,
        existing_screens: existingScreens,
        manifest
    }, null, 2));
}

function cmdRegisterFigma(args) {
    const id = String(args.id || '');
    const index = loadIndex();
    const existingHu = index.user_stories[id] || {};

    const platform = (args.platform || existingHu.platform || '').toLowerCase();
    const functionality = (args.functionality || existingHu.functionality || '').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    const fileKey = args['file-key'] || '';
    const nodeId = args['node-id'] || '';
    const figmaUrl = args.url || '';

    if (!id || !platform || !functionality) {
        console.error('Usage: node manage_ado_index.js register-figma --id <ID_HU> --platform <web|mobile> --functionality <slug> [--file-key <key>] [--node-id <node>] [--url <url>]');
        process.exit(1);
    }

    const figmaDir = path.join(INPUT_DIR, platform, functionality, id, 'figma');
    const screensDir = path.join(figmaDir, 'screens');
    fs.mkdirSync(screensDir, { recursive: true });

    const screenFiles = fs.readdirSync(screensDir)
        .filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f))
        .sort();

    const syncTimestamp = new Date().toISOString();
    const contextFileRel = `input/${platform}/${functionality}/${id}/figma/figma_context_${id}.md`;
    const manifestPath = path.join(figmaDir, 'figma_manifest.json');

    const manifest = {
        id_hu: Number(id),
        platform,
        functionality,
        file_key: fileKey,
        root_node_id: nodeId,
        figma_url: figmaUrl,
        last_synced: syncTimestamp,
        context_file: contextFileRel,
        screens_dir: `input/${platform}/${functionality}/${id}/figma/screens`,
        screens_count: screenFiles.length,
        screens: screenFiles.map(f => `input/${platform}/${functionality}/${id}/figma/screens/${f}`)
    };

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

    const figmaLinks = new Set(existingHu.figma_links || []);
    if (figmaUrl) figmaLinks.add(figmaUrl);

    index.user_stories[id] = {
        ...existingHu,
        id: Number(id),
        platform,
        functionality,
        folder_path: existingHu.folder_path || `input/${platform}/${functionality}/${id}`,
        figma_links: Array.from(figmaLinks),
        figma: manifest
    };

    saveIndex(index);

    console.log(JSON.stringify({
        status: 'SUCCESS',
        id: Number(id),
        figma_manifest: `input/${platform}/${functionality}/${id}/figma/figma_manifest.json`,
        screens_registered: screenFiles.length,
        screens: manifest.screens
    }, null, 2));
}

function cmdRebuildIndex() {
    const index = loadIndex();
    saveIndex(index);
    console.log(JSON.stringify({
        status: 'SUCCESS',
        index_json: 'input/index.json',
        index_md: 'input/INDEX.md',
        stats: index.stats
    }, null, 2));
}

function main() {
    const args = parseArgs(process.argv);
    const command = args._[0];

    switch (command) {
        case 'check':
            cmdCheck(args);
            break;
        case 'check-figma':
            cmdCheckFigma(args);
            break;
        case 'find':
            cmdFind(args);
            break;
        case 'upsert-hu':
            cmdUpsertHu(args);
            break;
        case 'upsert-feature':
            cmdUpsertFeature(args);
            break;
        case 'register-figma':
            cmdRegisterFigma(args);
            break;
        case 'rebuild-index':
            cmdRebuildIndex();
            break;
        default:
            console.log('Commands: check | check-figma | find | upsert-hu | upsert-feature | register-figma | rebuild-index');
            process.exit(0);
    }
}

main();
