# Workflow Script for WF-03 (qa_orchestrator): Batch Parallel Test Case Design (3+ HUs)
# Executed via Antigravity's native `run_workflow` tool when the user approves Parallel Mode for 3+ User Stories
# and has already confirmed the Global Design Parameters (Release, Area, Layers, OS/Device Strategy).
# Token Economy Policy: Each agent writes `casos_prueba_<ID_HU>.csv` and `casos_prueba_<ID_HU>_clasificados.md`
# directly to disk and returns ONLY a compact JSON file-pointer summary.

hus = args.get("hus", [])
platform = args.get("platform", "mobile")
functionality = args.get("functionality", "consulta_echeq")
release = args.get("release", "R19")
area_code = args.get("area_code", "CSM_SIF")
layers = args.get("layers", ["FE", "BFF"])
device_strategy = args.get("device_strategy", "Opción A: Unificada por plataforma")

RESULT_SCHEMA = {
    "type": "object",
    "properties": {
        "hu_id": {"type": "number"},
        "total_cases": {"type": "number"},
        "csv_file": {"type": "string"},
        "classified_md_file": {"type": "string"},
        "pending_doubts_file": {"type": "string"},
        "by_layer": {"type": "object"},
        "regression_candidates_count": {"type": "number"}
    },
    "required": [
        "hu_id",
        "total_cases",
        "csv_file",
        "classified_md_file",
        "regression_candidates_count"
    ]
}

phase("Nivel 4: Diseño Funcional ISTQB en Paralelo")
log(f"Iniciando diseño paralelo para {len(hus)} HUs | Release: [{release}] | Área: {area_code} | Estrategia: {device_strategy}")

def run_designer(hu):
    hu_id = hu["id"]
    analysis_file = f"output/analysis/{functionality}/{hu_id}/analisis_{hu_id}.md"
    out_dir = f"output/testCases/{functionality}/{hu_id}"
    csv_file = f"{out_dir}/casos_prueba_{hu_id}.csv"
    md_file = f"{out_dir}/casos_prueba_{hu_id}_clasificados.md"

    prompt = (
        f"Actúa como Diseñador QA Senior según `.agents/skills/qa_designer/SKILL.md`.\n"
        f"1. Lee el reporte de análisis aprobado en `{analysis_file}`.\n"
        f"2. Aplica los siguientes Parámetros Globales confirmados por el usuario:\n"
        f"   - Plataforma: `{platform}`\n"
        f"   - Release para casos de Regresión/Smoke: `[{release}]`\n"
        f"   - Código de Área en nomenclatura: `{area_code}`\n"
        f"   - Capas a cubrir: `{', '.join(layers)}` (recuerda que API pura no distingue Web/Mobile)\n"
        f"   - Estrategia de distribución por SO y Dispositivos: `{device_strategy}`\n"
        f"3. Cumple estrictamente `.agents/rules/nomenclatura_casos_prueba.md`, `.agents/rules/metadata_y_estructura_casos.md`, "
        f"`.agents/rules/criterios_web_y_mobile.md` y `.agents/rules/reglas_y_restricciones_negocio.md` "
        f"(11 categorías ISTQB, mínimo 2 pasos atómicos por caso, bimonetarismo `$` y `USD`, sin tipo ni tag Sanity, formato CSV de 12 columnas con comillas dobles RFC 4180).\n"
        f"4. Guarda los archivos en `{csv_file}` y `{md_file}`.\n"
        f"5. ECONOMÍA DE TOKENS (File-Pointer Return): NO devuelvas la tabla de casos en tu respuesta final; "
        f"devuelve únicamente el JSON requerido por el schema con las rutas generadas y el conteo de casos."
    )
    return agent(prompt=prompt, schema=RESULT_SCHEMA, role=f"QA Designer - HU {hu_id}")

results = await parallel(hus, run_designer)
for r in results:
    log(f"HU {r['hu_id']} -> {r['total_cases']} casos diseñados en {r['csv_file']}")

print(results)
