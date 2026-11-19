# Workflow Script for WF-02 (qa_orchestrator): Batch Parallel Static Analysis (3+ HUs)
# Executed via Antigravity's native `run_workflow` tool when the user approves Parallel Mode for 3+ User Stories.
# Token Economy Policy: Each agent writes `output/analysis/<funcionalidad>/<id_hu>/analisis_<id_hu>.md` directly
# to disk and returns ONLY a compact JSON file-pointer summary (never the full markdown report).

hus = args.get("hus", [])
platform = args.get("platform", "mobile")
functionality = args.get("functionality", "consulta_echeq")

RESULT_SCHEMA = {
    "type": "object",
    "properties": {
        "hu_id": {"type": "number"},
        "title": {"type": "string"},
        "analysis_file": {"type": "string"},
        "layers_impacted": {"type": "array", "items": {"type": "string"}},
        "discrepancies_count": {"type": "number"},
        "discrepancies_summary": {"type": "array", "items": {"type": "string"}},
        "questions_by_role": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "role": {"type": "string"},
                    "question": {"type": "string"}
                },
                "required": ["role", "question"]
            }
        }
    },
    "required": [
        "hu_id",
        "title",
        "analysis_file",
        "layers_impacted",
        "discrepancies_count",
        "discrepancies_summary",
        "questions_by_role"
    ]
}

phase("Nivel 3: Análisis Estático ISTQB y Triangulación en Paralelo")
log(f"Iniciando análisis paralelo para {len(hus)} Historias de Usuario ({platform}/{functionality})...")

def run_analyst(hu):
    hu_id = hu["id"]
    hu_path = hu.get("active_file", f"input/{platform}/{functionality}/{hu_id}/hu_{hu_id}.md")
    figma_dir = f"input/{platform}/{functionality}/{hu_id}/figma"
    out_file = f"output/analysis/{functionality}/{hu_id}/analisis_{hu_id}.md"

    prompt = (
        f"Actúa como Analista QA Senior según `.agents/skills/qa_analytics/SKILL.md`.\n"
        f"1. Lee la HU local en `{hu_path}`, sus adjuntos en `input/{platform}/{functionality}/{hu_id}/attachments/` "
        f"y sus pantallas de Figma en `{figma_dir}` (si existen). NO llames a los MCPs de ADO ni Figma.\n"
        f"2. Aplica las reglas `.agents/rules/triangulacion_visual_figma_ado.md`, `.agents/rules/criterios_web_y_mobile.md`, "
        f"`.agents/rules/reglas_y_restricciones_negocio.md` y `.agents/rules/no_suposiciones.md`.\n"
        f"3. Genera y guarda el reporte completo usando la plantilla `.agents/skills/qa_analytics/resources/template_analisis.md` "
        f"en la ruta exacta `{out_file}`.\n"
        f"4. ECONOMÍA DE TOKENS (File-Pointer Return): NO devuelvas el texto completo del reporte en tu respuesta final; "
        f"devuelve únicamente el JSON requerido por el schema con la ruta `{out_file}`, las capas impactadas, "
        f"el resumen de discrepancias y las preguntas clasificadas por rol (AFU/UX, TL, PO)."
    )
    return agent(prompt=prompt, schema=RESULT_SCHEMA, role=f"QA Analytics - HU {hu_id}")

results = await parallel(hus, run_analyst)
for r in results:
    log(f"HU {r['hu_id']} -> {r['analysis_file']} (Discrepancias: {r['discrepancies_count']}, Preguntas: {len(r['questions_by_role'])})")

print(results)
