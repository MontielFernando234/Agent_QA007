#!/usr/bin/env node
/**
 * inspect_playwright_project.js
 * 
 * Audita sin costo de tokens LLM la arquitectura existente de un proyecto Playwright
 * para que qa_automation NO invente ninguna arquitectura nueva y se adapte a los
 * lineamientos del repositorio destino.
 *
 * Uso:
 *   node .agents/skills/qa_automation/scripts/inspect_playwright_project.js [ruta_proyecto]
 */

const fs = require('fs');
const path = require('path');

const targetDir = path.resolve(process.argv[2] || process.cwd());

function fileExists(p) {
  try {
    return fs.existsSync(p) && fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

function dirExists(p) {
  try {
    return fs.existsSync(p) && fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function listDirSafe(dir, maxDepth = 3, currentDepth = 0) {
  if (currentDepth > maxDepth || !dirExists(dir)) return [];
  const ignored = new Set(['node_modules', '.git', 'dist', 'build', 'playwright-report', 'test-results', '.playwright-cli']);
  const results = [];
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    if (ignored.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(targetDir, fullPath).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      results.push({ type: 'dir', path: relPath });
      results.push(...listDirSafe(fullPath, maxDepth, currentDepth + 1));
    } else {
      results.push({ type: 'file', path: relPath });
    }
  }
  return results;
}

function inspectProject() {
  if (!dirExists(targetDir)) {
    console.error(JSON.stringify({ error: `El directorio no existe: ${targetDir}` }, null, 2));
    process.exit(1);
  }

  const configCandidates = [
    'playwright.config.ts',
    'playwright.config.js',
    'playwright.config.mjs',
    'playwright.config.cjs'
  ];

  const foundConfig = configCandidates.find((c) => fileExists(path.join(targetDir, c))) || null;
  let configSummary = {};

  if (foundConfig) {
    const content = fs.readFileSync(path.join(targetDir, foundConfig), 'utf8');
    const testDirMatch = content.match(/testDir\s*:\s*['"`]([^'"`]+)['"`]/);
    const baseURLMatch = content.match(/baseURL\s*:\s*([^,\n}]+)/);
    const testIdAttrMatch = content.match(/testIdAttribute\s*:\s*['"`]([^'"`]+)['"`]/);
    configSummary = {
      configFile: foundConfig,
      testDir: testDirMatch ? testDirMatch[1] : '(default / no explícito)',
      baseURL: baseURLMatch ? baseURLMatch[1].trim() : '(no definido en config)',
      testIdAttribute: testIdAttrMatch ? testIdAttrMatch[1] : 'data-testid (default Playwright)'
    };
  }

  let packageInfo = { hasPlaywrightTest: false, scripts: {} };
  const pkgPath = path.join(targetDir, 'package.json');
  if (fileExists(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      packageInfo = {
        hasPlaywrightTest: Boolean(deps['@playwright/test'] || deps['playwright']),
        playwrightVersion: deps['@playwright/test'] || deps['playwright'] || null,
        scripts: pkg.scripts || {}
      };
    } catch {
      // ignore parse errors
    }
  }

  const allEntries = listDirSafe(targetDir, 3);
  const dirs = allEntries.filter((e) => e.type === 'dir').map((e) => e.path);
  const files = allEntries.filter((e) => e.type === 'file').map((e) => e.path);

  // Detect architecture patterns
  const patternsDetected = [];
  if (dirs.some((d) => /(^|\/)(pages|pom|page-objects|pageobjects)(\/|$)/i.test(d))) {
    patternsDetected.push('Page Object Model (POM)');
  }
  if (dirs.some((d) => /(^|\/)(components|ui-components)(\/|$)/i.test(d))) {
    patternsDetected.push('Component Objects');
  }
  if (dirs.some((d) => /(^|\/)(actors|tasks|questions|screenplay)(\/|$)/i.test(d))) {
    patternsDetected.push('Screenplay Pattern');
  }
  if (files.some((f) => /fixture/i.test(f))) {
    patternsDetected.push('Custom Playwright Fixtures');
  }
  if (files.some((f) => /\.feature$/i.test(f))) {
    patternsDetected.push('BDD / Cucumber (.feature)');
  }
  if (files.some((f) => /seed\.spec\.(ts|js)$/i.test(f))) {
    patternsDetected.push('Playwright Seed Test');
  }

  const specFiles = files.filter((f) => /\.(spec|test)\.(ts|js|mjs)$/i.test(f));
  const pageObjectFiles = files.filter((f) => /(pages|pom|page-objects|components)\/.*\.(ts|js)$/i.test(f));
  const fixtureFiles = files.filter((f) => /fixture.*\.(ts|js)$/i.test(f));

  const report = {
    projectRoot: targetDir,
    isPlaywrightConfigured: Boolean(foundConfig || packageInfo.hasPlaywrightTest),
    playwrightConfig: configSummary,
    packageJson: packageInfo,
    architecturePatternsDetected: patternsDetected.length > 0 ? patternsDetected : ['Sin patrón explícito detectado (Planificar con el usuario)'],
    existingCounts: {
      specFiles: specFiles.length,
      pageObjectFiles: pageObjectFiles.length,
      fixtureFiles: fixtureFiles.length
    },
    sampleFiles: {
      specs: specFiles.slice(0, 15),
      pageObjects: pageObjectFiles.slice(0, 15),
      fixtures: fixtureFiles.slice(0, 10)
    }
  };

  console.log(JSON.stringify(report, null, 2));
}

inspectProject();
