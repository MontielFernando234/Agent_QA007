#!/usr/bin/env node
/**
 * Helper script for WF-06 (qa_orchestrator):
 * Compares two persisted revisions of a User Story (hu_<ID>_rev<OLD>.md vs hu_<ID>_rev<NEW>.md)
 * inside input/<platform>/<functionality>/<ID_HU>/versions/ and outputs a compact Delta report
 * so qa_analytics and qa_designer only process what changed, saving up to 90% of tokens.
 *
 * Usage:
 *   node diff_hu_versions.js --id <ID_HU> [--old-rev <N>] [--new-rev <M>]
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE_ROOT = process.cwd();
const INDEX_JSON_PATH = path.join(WORKSPACE_ROOT, 'input', 'index.json');

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

function splitSections(markdown) {
    const lines = markdown.split(/\r?\n/);
    const sections = {};
    let currentHeader = 'HEADER';
    sections[currentHeader] = [];

    for (const line of lines) {
        if (/^#{2,4}\s+/.test(line)) {
            currentHeader = line.trim();
            if (!sections[currentHeader]) sections[currentHeader] = [];
        } else {
            // Ignore sync timestamp line to avoid false positives
            if (line.includes('Fecha de sincronización local')) continue;
            sections[currentHeader].push(line);
        }
    }
    return sections;
}

function diffLines(oldLines, newLines) {
    const oldSet = new Set(oldLines.map(l => l.trim()).filter(Boolean));
    const newSet = new Set(newLines.map(l => l.trim()).filter(Boolean));

    const added = [...newSet].filter(l => !oldSet.has(l));
    const removed = [...oldSet].filter(l => !newSet.has(l));

    return { added, removed, hasChanges: added.length > 0 || removed.length > 0 };
}

function main() {
    const args = parseArgs(process.argv);
    const id = String(args.id || '');
    if (!id) {
        console.error('Usage: node diff_hu_versions.js --id <ID_HU> [--old-rev <N>] [--new-rev <M>]');
        process.exit(1);
    }

    if (!fs.existsSync(INDEX_JSON_PATH)) {
        console.error('Error: input/index.json does not exist yet.');
        process.exit(1);
    }

    const index = JSON.parse(fs.readFileSync(INDEX_JSON_PATH, 'utf8'));
    const hu = index.user_stories && index.user_stories[id];
    if (!hu) {
        console.error(`Error: User Story #${id} not found in input/index.json`);
        process.exit(1);
    }

    const revs = (hu.available_revs || []).slice().sort((a, b) => a - b);
    if (revs.length < 2 && (!args['old-rev'] || !args['new-rev'])) {
        console.log(JSON.stringify({
            status: 'SINGLE_VERSION',
            id: Number(id),
            available_revs: revs,
            message: `La HU #${id} solo posee 1 versión local (rev ${revs[0] || hu.active_rev}). No hay delta para comparar.`
        }, null, 2));
        process.exit(0);
    }

    const oldRev = args['old-rev'] ? Number(args['old-rev']) : revs[revs.length - 2];
    const newRev = args['new-rev'] ? Number(args['new-rev']) : revs[revs.length - 1];

    const oldFileRel = hu.version_files?.[String(oldRev)] || `${hu.folder_path}/versions/hu_${id}_rev${oldRev}.md`;
    const newFileRel = hu.version_files?.[String(newRev)] || `${hu.folder_path}/versions/hu_${id}_rev${newRev}.md`;

    const oldFilePath = path.join(WORKSPACE_ROOT, oldFileRel);
    const newFilePath = path.join(WORKSPACE_ROOT, newFileRel);

    if (!fs.existsSync(oldFilePath) || !fs.existsSync(newFilePath)) {
        console.error(`Error: One of the version files does not exist:\n- ${oldFileRel}\n- ${newFileRel}`);
        process.exit(1);
    }

    const oldSections = splitSections(fs.readFileSync(oldFilePath, 'utf8'));
    const newSections = splitSections(fs.readFileSync(newFilePath, 'utf8'));

    const allHeaders = Array.from(new Set([...Object.keys(oldSections), ...Object.keys(newSections)]));
    const changedSections = [];

    for (const header of allHeaders) {
        const diff = diffLines(oldSections[header] || [], newSections[header] || []);
        if (diff.hasChanges) {
            changedSections.push({
                section: header,
                added_lines: diff.added,
                removed_lines: diff.removed
            });
        }
    }

    console.log(JSON.stringify({
        status: 'SUCCESS',
        hu_id: Number(id),
        title: hu.title,
        old_rev: oldRev,
        new_rev: newRev,
        total_sections_changed: changedSections.length,
        changed_sections: changedSections
    }, null, 2));
}

main();
