#!/usr/bin/env node
/**
 * audit_playwright_locators.js
 *
 * Audita estáticamente archivos de tests o Page Objects de Playwright para asegurar
 * el cumplimiento de RULE[automatizacion_playwright_locators.md]:
 *   1. Detecta uso de XPath (PROHIBIDO salvo autorización explícita del usuario).
 *   2. Clasifica y contabiliza locators según la jerarquía oficial:
 *      - Nivel 1 (Semánticos): getByRole, getByLabel, getByPlaceholder, getByText, getByAltText, getByTitle
 *      - Nivel 2 (Test Contracts): getByTestId
 *      - Nivel 3 (Custom .locator): .locator(...)
 *   3. Detecta antipatrones de sincronización (waitForTimeout, networkidle) y selectores CSS frágiles (nth-child, clases dinámicas).
 *
 * Uso:
 *   node .agents/skills/qa_automation/scripts/audit_playwright_locators.js <archivo_o_directorio> [--allow-xpath]
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const targetInput = args.find((a) => !a.startsWith('--'));
const allowXpath = args.includes('--allow-xpath');

if (!targetInput) {
  console.error('Uso: node audit_playwright_locators.js <archivo_o_directorio> [--allow-xpath]');
  process.exit(1);
}

const targetPath = path.resolve(targetInput);

function collectFiles(p) {
  if (!fs.existsSync(p)) return [];
  const stat = fs.statSync(p);
  if (stat.isFile()) return [p];
  const results = [];
  const ignored = new Set(['node_modules', '.git', 'dist', 'build', 'playwright-report', 'test-results']);
  for (const entry of fs.readdirSync(p, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const full = path.join(p, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(full));
    } else if (/\.(ts|js|mjs)$/.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

function auditFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);

  const stats = {
    semanticLocators: 0, // getByRole, getByLabel, getByPlaceholder, getByText, getByAltText, getByTitle
    testIdLocators: 0,   // getByTestId
    customLocators: 0,   // .locator(...)
    xpathViolations: [],
    antiPatterns: []
  };

  const semanticRegex = /\.(getByRole|getByLabel|getByPlaceholder|getByText|getByAltText|getByTitle)\s*\(/g;
  const testIdRegex = /\.getByTestId\s*\(/g;
  const customLocatorRegex = /\.locator\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/g;

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;

    // Count semantic locators
    const semMatches = line.match(semanticRegex);
    if (semMatches) stats.semanticLocators += semMatches.length;

    // Count testId locators
    const tidMatches = line.match(testIdRegex);
    if (tidMatches) stats.testIdLocators += tidMatches.length;

    // Check custom .locator(...) calls
    let match;
    while ((match = customLocatorRegex.exec(line)) !== null) {
      stats.customLocators += 1;
      const selector = match[2].trim();

      // Check for XPath
      const isXpath =
        selector.startsWith('xpath=') ||
        selector.startsWith('//') ||
        selector.startsWith('(//') ||
        selector.startsWith('./') ||
        selector.startsWith('..');

      if (isXpath) {
        stats.xpathViolations.push({
          line: lineNum,
          selector,
          message: 'XPath detectado. PROHIBIDO por defecto salvo autorización explícita del usuario.'
        });
      }

      // Check fragile CSS selectors inside .locator()
      if (/(:nth-child\(\d+\)|>.*>.*>)/.test(selector)) {
        stats.antiPatterns.push({
          line: lineNum,
          type: 'FRAGILE_CSS_SELECTOR',
          selector,
          message: 'Selector CSS potencialmente frágil en .locator(). Preferir atributos estables o encadenar con .filter({ hasText }).'
        });
      }
    }

    // Check explicit page.$x or xpath= outside standard quotes
    if (/xpath\s*=/.test(line) && !stats.xpathViolations.some((v) => v.line === lineNum)) {
      stats.xpathViolations.push({
        line: lineNum,
        selector: trimmed,
        message: 'Expresión xpath= detectada. PROHIBIDO salvo autorización explícita del usuario.'
      });
    }

    // Anti-patterns: waitForTimeout / networkidle
    if (/\.waitForTimeout\s*\(/.test(line)) {
      stats.antiPatterns.push({
        line: lineNum,
        type: 'HARD_SLEEP',
        selector: trimmed,
        message: 'Uso de waitForTimeout detectado. Usar aserciones Web-First auto-reintentables (expect(locator).toBeVisible(), etc.).'
      });
    }
    if (/['"`]networkidle['"`]/.test(line)) {
      stats.antiPatterns.push({
        line: lineNum,
        type: 'NETWORKIDLE',
        selector: trimmed,
        message: 'Uso de networkidle desaconsejado por Playwright. Esperar por elementos/estados visibles concretos.'
      });
    }
  });

  return stats;
}

const files = collectFiles(targetPath);
const summary = {
  filesScanned: files.length,
  totals: {
    tier1_semantic: 0,
    tier2_testId: 0,
    tier3_customLocator: 0,
    xpathCount: 0,
    antiPatternCount: 0
  },
  passed: true,
  fileReports: []
};

for (const f of files) {
  const res = auditFile(f);
  summary.totals.tier1_semantic += res.semanticLocators;
  summary.totals.tier2_testId += res.testIdLocators;
  summary.totals.tier3_customLocator += res.customLocators;
  summary.totals.xpathCount += res.xpathViolations.length;
  summary.totals.antiPatternCount += res.antiPatterns.length;

  const hasBlockingXpath = res.xpathViolations.length > 0 && !allowXpath;
  if (hasBlockingXpath) summary.passed = false;

  if (
    res.semanticLocators > 0 ||
    res.testIdLocators > 0 ||
    res.customLocators > 0 ||
    res.xpathViolations.length > 0 ||
    res.antiPatterns.length > 0
  ) {
    summary.fileReports.push({
      file: path.relative(process.cwd(), f).replace(/\\/g, '/'),
      ...res
    });
  }
}

console.log(JSON.stringify(summary, null, 2));
if (!summary.passed) {
  process.exit(2);
}
