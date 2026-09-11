import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

OUTPUT_DIR = r"c:\Users\ASUS\Desktop\Antigravity\Proyecto Valentina\assets\politicas-y-precios"
LOGO_PATH = r"c:\Users\ASUS\Desktop\Antigravity\Proyecto Valentina\assets\branding\valentina-logo-horizontal-light.png"

# Paleta Valentina AI
C_DARK = RGBColor(15, 23, 42)       # #0F172A
C_IRIS = RGBColor(109, 40, 217)     # #6D28D9
C_CYAN = RGBColor(6, 182, 212)      # #06B6D4
C_EMERALD = RGBColor(5, 150, 105)   # #059669
C_TEXT = RGBColor(51, 65, 85)       # #334155
C_MUTED = RGBColor(100, 116, 139)   # #64748B
C_AMBER = RGBColor(180, 83, 9)      # #B45309

HEX_HEADER_BG = "0F172A"
HEX_ROW_EVEN = "F8FAFC"
HEX_PURPLE_BG = "FAF5FF"
HEX_PURPLE_BORDER = "A855F7"
HEX_GREEN_BG = "F0FDF4"
HEX_GREEN_BORDER = "10B981"
HEX_AMBER_BG = "FFFBEB"
HEX_AMBER_BORDER = "F59E0B"

def set_cell_shading(cell, color_hex):
    tcPr = cell._element.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=120, bottom=120, left=160, right=160):
    tcPr = cell._element.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)

def set_table_borders(table, color_hex="E2E8F0"):
    tblPr = table._element.xpath('w:tblPr')
    if tblPr:
        borders = parse_xml(
            f'<w:tblBorders {nsdecls("w")}>'
            f'<w:top w:val="single" w:sz="4" w:space="0" w:color="{color_hex}"/>'
            f'<w:bottom w:val="single" w:sz="8" w:space="0" w:color="{color_hex}"/>'
            f'<w:insideH w:val="single" w:sz="4" w:space="0" w:color="{color_hex}"/>'
            f'<w:insideV w:val="none"/>'
            f'<w:left w:val="none"/>'
            f'<w:right w:val="none"/>'
            f'</w:tblBorders>'
        )
        tblPr[0].append(borders)

def setup_letterhead_page(doc, folio_code="VAL-OF-2026"):
    section = doc.sections[0]
    section.top_margin = Inches(1.1)
    section.bottom_margin = Inches(1.0)
    section.left_margin = Inches(1.0)
    section.right_margin = Inches(1.0)
    section.header_distance = Inches(0.4)
    section.footer_distance = Inches(0.4)
    
    # Header en cada página
    header = section.header
    header.is_linked_to_previous = False
    htab = header.add_table(rows=1, cols=2, width=Inches(6.5))
    htab.alignment = WD_TABLE_ALIGNMENT.CENTER
    htab.autofit = False
    htab.columns[0].width = Inches(3.8)
    htab.columns[1].width = Inches(2.7)
    
    c_left = htab.cell(0, 0)
    p_left = c_left.paragraphs[0]
    p_left.paragraph_format.space_before = Pt(0)
    p_left.paragraph_format.space_after = Pt(0)
    if os.path.exists(LOGO_PATH):
        r_logo = p_left.add_run()
        r_logo.add_picture(LOGO_PATH, width=Inches(1.85))
    else:
        r_txt = p_left.add_run("VALENTINA AI")
        r_txt.bold = True
        r_txt.font.size = Pt(14)
        r_txt.font.color.rgb = C_IRIS
        
    c_right = htab.cell(0, 1)
    p_right = c_right.paragraphs[0]
    p_right.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_right.paragraph_format.space_before = Pt(0)
    p_right.paragraph_format.space_after = Pt(0)
    
    rf = p_right.add_run(f"{folio_code}\n")
    rf.font.name = "Arial"
    rf.font.size = Pt(8.5)
    rf.font.bold = True
    rf.font.color.rgb = C_IRIS
    
    rsede = p_right.add_run("Santiago de Querétaro, Qro. • valentina-ai.mx")
    rsede.font.name = "Arial"
    rsede.font.size = Pt(8)
    rsede.font.color.rgb = C_MUTED
    
    # Línea divisoria en header
    bp = header.add_paragraph()
    bp.paragraph_format.space_before = Pt(4)
    bp.paragraph_format.space_after = Pt(0)
    pBrd = parse_xml(f'<w:pBdr {nsdecls("w")}><w:bottom w:val="single" w:sz="6" w:space="1" w:color="E2E8F0"/></w:pBdr>')
    bp._p.get_or_add_pPr().append(pBrd)

    # Footer en cada página
    footer = section.footer
    footer.is_linked_to_previous = False
    
    pf_top = footer.paragraphs[0]
    pf_top.paragraph_format.space_before = Pt(0)
    pf_top.paragraph_format.space_after = Pt(4)
    pBrd2 = parse_xml(f'<w:pBdr {nsdecls("w")}><w:top w:val="single" w:sz="6" w:space="1" w:color="E2E8F0"/></w:pBdr>')
    pf_top._p.get_or_add_pPr().append(pBrd2)
    
    ftab = footer.add_table(rows=1, cols=2, width=Inches(6.5))
    ftab.alignment = WD_TABLE_ALIGNMENT.CENTER
    ftab.autofit = False
    ftab.columns[0].width = Inches(4.5)
    ftab.columns[1].width = Inches(2.0)
    
    cf_l = ftab.cell(0, 0)
    pfl = cf_l.paragraphs[0]
    pfl.paragraph_format.space_before = Pt(0)
    pfl.paragraph_format.space_after = Pt(0)
    r1 = pfl.add_run("VALENTINA AI S.A.S. • Manuel Gómez Morín 3960, Centro Sur, Querétaro, Qro.\n")
    r1.font.name = "Arial"
    r1.font.size = Pt(7.5)
    r1.font.bold = True
    r1.font.color.rgb = C_DARK
    r2 = pfl.add_run("contacto@valentina-ai.mx • WhatsApp: +52 442 352 3965 • Respaldo UGES")
    r2.font.name = "Arial"
    r2.font.size = Pt(7)
    r2.font.color.rgb = C_MUTED
    
    cf_r = ftab.cell(0, 1)
    pfr = cf_r.paragraphs[0]
    pfr.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    pfr.paragraph_format.space_before = Pt(0)
    pfr.paragraph_format.space_after = Pt(0)
    r_val = pfr.add_run("Documento Oficial • Validez B2B")
    r_val.font.name = "Arial"
    r_val.font.size = Pt(7.5)
    r_val.font.bold = True
    r_val.font.color.rgb = C_IRIS

def add_title_block(doc, tag, title, subtitle):
    p_tag = doc.add_paragraph()
    p_tag.paragraph_format.space_before = Pt(4)
    p_tag.paragraph_format.space_after = Pt(2)
    r_tag = p_tag.add_run(f"■ {tag.upper()}")
    r_tag.font.name = "Arial"
    r_tag.font.size = Pt(8.5)
    r_tag.font.bold = True
    r_tag.font.color.rgb = C_IRIS
    
    p_h1 = doc.add_paragraph()
    p_h1.paragraph_format.space_before = Pt(0)
    p_h1.paragraph_format.space_after = Pt(4)
    r_h1 = p_h1.add_run(title)
    r_h1.font.name = "Arial"
    r_h1.font.size = Pt(17)
    r_h1.font.bold = True
    r_h1.font.color.rgb = C_DARK
    
    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_before = Pt(0)
    p_sub.paragraph_format.space_after = Pt(12)
    r_sub = p_sub.add_run(subtitle)
    r_sub.font.name = "Calibri"
    r_sub.font.size = Pt(10)
    r_sub.font.color.rgb = C_MUTED

def add_heading2(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(14)
    p.paragraph_format.space_after = Pt(4)
    r = p.add_run(text)
    r.font.name = "Arial"
    r.font.size = Pt(12)
    r.font.bold = True
    r.font.color.rgb = C_IRIS

def add_p(doc, text, bold_prefix=""):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        r_b = p.add_run(bold_prefix)
        r_b.font.name = "Calibri"
        r_b.font.size = Pt(10.5)
        r_b.font.bold = True
        r_b.font.color.rgb = C_DARK
    r = p.add_run(text)
    r.font.name = "Calibri"
    r.font.size = Pt(10.5)
    r.font.color.rgb = C_TEXT

def add_callout(doc, title, text, bg_hex=HEX_PURPLE_BG, border_hex=HEX_PURPLE_BORDER, icon_symbol="ℹ"):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    tbl.columns[0].width = Inches(6.5)
    
    cell = tbl.cell(0, 0)
    set_cell_shading(cell, bg_hex)
    set_cell_margins(cell, top=100, bottom=100, left=160, right=140)
    
    tcPr = cell._element.get_or_add_tcPr()
    borders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'<w:top w:val="none"/>'
        f'<w:left w:val="single" w:sz="20" w:space="0" w:color="{border_hex}"/>'
        f'<w:bottom w:val="none"/>'
        f'<w:right w:val="none"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(borders)
    
    p1 = cell.paragraphs[0]
    p1.paragraph_format.space_before = Pt(0)
    p1.paragraph_format.space_after = Pt(2)
    r1 = p1.add_run(f"{icon_symbol}  {title}")
    r1.font.name = "Arial"
    r1.font.size = Pt(9.5)
    r1.font.bold = True
    r1.font.color.rgb = C_DARK
    
    p2 = cell.add_paragraph()
    p2.paragraph_format.space_before = Pt(0)
    p2.paragraph_format.space_after = Pt(0)
    r2 = p2.add_run(text)
    r2.font.name = "Calibri"
    r2.font.size = Pt(9.5)
    r2.font.color.rgb = C_TEXT
    
    p_sp = doc.add_paragraph()
    p_sp.paragraph_format.space_before = Pt(0)
    p_sp.paragraph_format.space_after = Pt(6)

def add_signatures(doc, name_left="VALENTINA AI S.A.S.", title_left="Ingeniería & Representante Autorizado",
                   name_right="EL CLIENTE / TITULAR", title_right="Representante Legal Autorizado"):
    p_sp = doc.add_paragraph()
    p_sp.paragraph_format.space_before = Pt(16)
    p_sp.paragraph_format.space_after = Pt(6)
    
    tbl = doc.add_table(rows=2, cols=2)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    tbl.columns[0].width = Inches(3.1)
    tbl.columns[1].width = Inches(3.1)
    
    # Fila 0: líneas de firma
    c0 = tbl.cell(0, 0)
    c1 = tbl.cell(0, 1)
    p0 = c0.paragraphs[0]
    p0.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p0.paragraph_format.space_after = Pt(2)
    r_l1 = p0.add_run("________________________________________")
    r_l1.font.color.rgb = C_MUTED
    
    p1 = c1.paragraphs[0]
    p1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p1.paragraph_format.space_after = Pt(2)
    r_l2 = p1.add_run("________________________________________")
    r_l2.font.color.rgb = C_MUTED
    
    # Fila 1: nombres y cargos
    c2 = tbl.cell(1, 0)
    c3 = tbl.cell(1, 1)
    p2 = c2.paragraphs[0]
    p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_n1 = p2.add_run(f"{name_left}\n")
    r_n1.font.name = "Arial"
    r_n1.font.size = Pt(9.5)
    r_n1.font.bold = True
    r_n1.font.color.rgb = C_DARK
    r_t1 = p2.add_run(title_left)
    r_t1.font.name = "Calibri"
    r_t1.font.size = Pt(8.5)
    r_t1.font.color.rgb = C_MUTED
    
    p3 = c3.paragraphs[0]
    p3.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_n2 = p3.add_run(f"{name_right}\n")
    r_n2.font.name = "Arial"
    r_n2.font.size = Pt(9.5)
    r_n2.font.bold = True
    r_n2.font.color.rgb = C_DARK
    r_t2 = p3.add_run(title_right)
    r_t2.font.name = "Calibri"
    r_t2.font.size = Pt(8.5)
    r_t2.font.color.rgb = C_MUTED

# ==============================================================================
# 1. GENERAR: Hoja_Membretada_Oficial_Valentina_AI.docx (Plantilla Maestra)
# ==============================================================================
def generate_hoja_membretada():
    doc = docx.Document()
    setup_letterhead_page(doc, "REF: VAL-MEM-2026-PLANTILLA")
    
    add_title_block(
        doc,
        "Formato Oficial",
        "Plantilla Maestra de Hoja Membretada Corporativa",
        "Diseñada para comunicados ejecutivos, minutas técnicas, cotizaciones y acuerdos institucionales."
    )
    
    add_callout(
        doc,
        "Instrucciones de Uso de la Plantilla",
        "Este documento en formato Word (.docx) cuenta con encabezados y pies de página oficiales vinculados en cada hoja con el logotipo de Valentina AI, domicilio fiscal y registros institucionales. Puedes reemplazar este texto por el contenido de tu propuesta o carta formal.",
        HEX_PURPLE_BG,
        HEX_PURPLE_BORDER,
        "■"
    )
    
    add_heading2(doc, "1. Asunto y Propósito de la Comunicación")
    add_p(doc, "Redacta en este espacio el resumen ejecutivo del asunto tratado. La tipografía base recomendada es Calibri de 10.5 puntos con un interlineado de 1.15, preservando la sobriedad y legibilidad ejecutiva requerida en entornos corporativos B2B.")
    
    add_heading2(doc, "2. Detalles Técnicos o Términos Específicos")
    add_p(doc, "Describe aquí los alcances, acuerdos de reunión o especificaciones técnicas del proyecto. La estructura mantiene márgenes simétricos de 1 pulgada (2.54 cm), lo que asegura una presentación pulcra tanto al imprimirse como al exportarse a PDF.")
    
    add_callout(
        doc,
        "Garantía de Estándar Institucional",
        "Toda solución emitida por Valentina AI cuenta con respaldo de infraestructura validada en Querétaro y trazabilidad bajo certificaciones de validez oficial.",
        HEX_GREEN_BG,
        HEX_GREEN_BORDER,
        "✔"
    )
    
    add_signatures(doc, "DIRECCIÓN TÉCNICA", "Valentina AI Studio", "REPRESENTANTE AUTORIZADO", "Empresa / Institución Contratante")
    
    filepath = os.path.join(OUTPUT_DIR, "Hoja_Membretada_Oficial_Valentina_AI.docx")
    doc.save(filepath)
    print(f"Generado: {filepath}")

# ==============================================================================
# 2. GENERAR: Politica_de_Precios_y_Costeo_Operativo_Valentina_AI.docx
# ==============================================================================
def generate_politica_precios():
    doc = docx.Document()
    setup_letterhead_page(doc, "REF: POL-COM-VAL-2026-B")
    
    add_title_block(
        doc,
        "Política Comercial Oficial",
        "Política de Precios, Niveles de Servicio y Costeo Operativo",
        "Estructura comercial, desglose de planes Growth / Scale / Enterprise y delimitación transparente de costos de Meta (WhatsApp API)."
    )
    
    add_callout(
        doc,
        "Modelo Híbrido sin Costos Ocultos",
        "Valentina AI opera mediante un Costo de Implementación único (Setup) + una Suscripción Mensual de Operación e IA. No cobramos comisiones por mensaje ni inflamos las tarifas de telecomunicaciones. El cliente mantiene el control total de sus canales.",
        HEX_PURPLE_BG,
        HEX_PURPLE_BORDER,
        "🎯"
    )
    
    add_heading2(doc, "1. Matriz de Planes y Niveles de Automatización")
    add_p(doc, "Ofrecemos dos soluciones comerciales estandarizadas listas para despliegue ágil (Growth y Scale) y un nivel Enterprise a la medida para organizaciones que requieren integración profunda con bases de datos internas o sistemas ERP:")
    
    # Tabla de Planes
    table = doc.add_table(rows=4, cols=4)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    set_table_borders(table)
    
    col_widths = [Inches(1.5), Inches(1.4), Inches(1.3), Inches(2.3)]
    for row in table.rows:
        for i, w in enumerate(col_widths):
            row.cells[i].width = w
            
    headers = ["Plan / Nivel", "Setup (Pago Único)", "Mensualidad (MRR)", "Alcance Técnico Clave"]
    for i, title in enumerate(headers):
        cell = table.cell(0, i)
        set_cell_shading(cell, HEX_HEADER_BG)
        set_cell_margins(cell, 120, 120, 120, 120)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        r = p.add_run(title)
        r.font.name = "Arial"
        r.font.size = Pt(8.5)
        r.font.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)
        
    data = [
        [
            "Plan Growth\n(Nivel 1: Calificación)",
            "$8,500 MXN\n(50% anticipo / 50% entrega)",
            "$2,800 MXN/mes\n(Anual: $2,350/mes)",
            "WhatsApp Cloud API oficial. Base de conocimiento RAG, calificación de prospectos y derivación con alerta a humano por WhatsApp."
        ],
        [
            "Plan Scale ★\n(Nivel 2: Cotizador & CRM)\n[RECOMENDADO]",
            "$16,500 MXN\n(50% anticipo / 50% entrega)",
            "$5,600 MXN/mes\n(Anual: $4,700/mes)",
            "WhatsApp + Webchat + Instagram DM. Motor de cotización determinista en tiempo real, reserva de citas en Calendar y sincronización con CRM."
        ],
        [
            "Plan Enterprise\n(Nivel 3: Core & ERP)",
            "Desde $38,500 MXN\n(Según complejidad de APIs)",
            "Desde $12,500 MXN/mes\n(SLA y soporte 4h)",
            "Conexión a ERP / SQL Server / Postgres. Validación de comprobantes con visión artificial OCR forense, folios dinámicos en PDF y guardrails bancarios."
        ]
    ]
    
    for row_idx, row_data in enumerate(data, start=1):
        shading = HEX_ROW_EVEN if row_idx % 2 == 0 else "FFFFFF"
        for col_idx, text in enumerate(row_data):
            cell = table.cell(row_idx, col_idx)
            set_cell_shading(cell, shading)
            set_cell_margins(cell, 100, 100, 120, 120)
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            r = p.add_run(text)
            r.font.name = "Calibri"
            r.font.size = Pt(8.5)
            r.font.color.rgb = C_DARK if col_idx < 3 else C_TEXT
            if "★" in text or "$16,500" in text or "$5,600" in text:
                r.font.bold = True
                
    p_sp = doc.add_paragraph()
    p_sp.paragraph_format.space_before = Pt(4)
    p_sp.paragraph_format.space_after = Pt(4)
    
    add_callout(
        doc,
        "Beneficio Exclusivo por Pago Anual Anticipado",
        "Las organizaciones que opten por contratación anual por adelantado obtienen: 2 meses de mensualidad bonificados al 100% (pagan 10 meses y reciben 12) más un 50% de descuento directo en el Costo de Implementación (Setup Fee).",
        HEX_GREEN_BG,
        HEX_GREEN_BORDER,
        "🎁"
    )
    
    add_heading2(doc, "2. Delimitación de Costos: ¿Quién paga qué y hasta qué punto?")
    add_p(doc, "Para garantizar transparencia ética y financiera, la siguiente matriz define con total precisión qué conceptos cubre la tarifa de Valentina AI y qué conceptos se cubren directamente ante proveedores externos:")
    
    add_p(doc, "Desarrollo y mantenimiento continuo del asistente, infraestructura de servidores cloud dedicados, consumo de tokens de inferencia de IA (gemini-3.5-flash-lite) bajo uso razonable, hasta 2 horas mensuales de calibración y soporte 24/7.", "A) Cubierto al 100% por Valentina AI: ")
    add_p(doc, "Tarifas de telecomunicación de Meta (WhatsApp Cloud API) a costo oficial directo sin comisiones infladas, titularidad de la línea telefónica y cuentas o licencias propias del cliente (HubSpot, Google Workspace, CRM interno).", "B) A cargo directo del Cliente: ")
    
    add_heading2(doc, "3. Regulación de Meta y Estimación Transparente de Mensajería (Octubre 2026)")
    add_p(doc, "A partir del 1 de octubre de 2026, Meta actualiza sus tarifas oficiales cobrando $0.0085 USD por mensaje de servicio en la API una vez superados los 1,000 mensajes mensuales gratuitos. Para evitar cualquier sorpresa, presentamos la estimación honesta de consumo mensual según el volumen de operación de su empresa:")
    
    # Tabla de Meta
    t_meta = doc.add_table(rows=4, cols=4)
    t_meta.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_meta.autofit = False
    set_table_borders(t_meta)
    
    w_meta = [Inches(1.5), Inches(1.5), Inches(1.6), Inches(1.9)]
    for row in t_meta.rows:
        for i, w in enumerate(w_meta):
            row.cells[i].width = w
            
    meta_headers = ["Volumen Mensual", "Mensajes Estimados", "Gasto Estimado en Meta", "Recomendación Operativa"]
    for i, title in enumerate(meta_headers):
        cell = t_meta.cell(0, i)
        set_cell_shading(cell, HEX_HEADER_BG)
        set_cell_margins(cell, 120, 120, 120, 120)
        p = cell.paragraphs[0]
        r = p.add_run(title)
        r.font.name = "Arial"
        r.font.size = Pt(8.5)
        r.font.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)
        
    meta_data = [
        ["~1,500 conversaciones\n(Típico Plan Growth)", "6,000 – 11,000 mensajes", "$750 – $1,900 MXN/mes\n(~$42 – $94 USD)", "Tarjeta con límite de $2,500 MXN en Meta Business."],
        ["~4,000 conversaciones\n(Típico Plan Scale)", "16,000 – 28,000 mensajes", "$2,200 – $4,500 MXN/mes\n(~$125 – $230 USD)", "Fijar tope de gasto mensual en Meta Business Manager."],
        ["~10,000 conversaciones\n(Plan Enterprise)", "40,000 – 75,000 mensajes", "$6,000 – $13,000 MXN/mes\n(~$330 – $650 USD)", "Sesión de presupuesto previa y optimización de turnos."]
    ]
    
    for row_idx, row_data in enumerate(meta_data, start=1):
        shading = HEX_ROW_EVEN if row_idx % 2 == 0 else "FFFFFF"
        for col_idx, text in enumerate(row_data):
            cell = t_meta.cell(row_idx, col_idx)
            set_cell_shading(cell, shading)
            set_cell_margins(cell, 100, 100, 120, 120)
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            r = p.add_run(text)
            r.font.name = "Calibri"
            r.font.size = Pt(8.5)
            r.font.color.rgb = C_DARK if col_idx != 2 else C_AMBER
            if col_idx == 2:
                r.font.bold = True
                
    p_sp2 = doc.add_paragraph()
    p_sp2.paragraph_format.space_before = Pt(6)
    p_sp2.paragraph_format.space_after = Pt(2)
    
    add_callout(
        doc,
        "Garantía Comercial de Precisión Técnica (30 Días)",
        "Valentina AI garantiza que el agente conversacional alcanzará una resolución autónoma superior al 80% sobre consultas recurrentes de su catálogo verificado. Si durante los primeros 30 días posteriores al pase a producción se detectan desviaciones lógicas, recalibraremos los flujos y modelos sin costo adicional.",
        HEX_AMBER_BG,
        HEX_AMBER_BORDER,
        "🛡"
    )
    
    add_signatures(doc, "DIRECCIÓN COMERCIAL & PRODUCTO", "Valentina AI Studio", "DIRECCIÓN DE OPERACIONES & CLIENTE", "Aceptación de Términos Comerciales")
    
    filepath = os.path.join(OUTPUT_DIR, "Politica_de_Precios_y_Costeo_Operativo_Valentina_AI.docx")
    doc.save(filepath)
    print(f"Generado: {filepath}")

# ==============================================================================
# 3. GENERAR: Convenio_Comercial_Servicios_IA_Valentina_AI.docx
# ==============================================================================
def generate_convenio_servicios():
    doc = docx.Document()
    setup_letterhead_page(doc, "REF: CONV-SRV-2026-VAL")
    
    add_title_block(
        doc,
        "Instrumento Jurídico B2B",
        "Convenio de Prestación de Servicios de Tecnología e Inteligencia Artificial",
        "Celebrado entre VALENTINA AI S.A.S. (EL PRESTADOR) y la Persona Física o Moral contratante (EL CLIENTE)."
    )
    
    add_heading2(doc, "DECLARACIONES")
    add_p(doc, "Ser una entidad legalmente constituida bajo las leyes de los Estados Unidos Mexicanos, con domicilio en Manuel Gómez Morín 3960, Centro Sur, Querétaro, Qro., especializada en ingeniería, arquitectura conversacional y automatización de procesos mediante Inteligencia Artificial.", "I. Declara EL PRESTADOR: ")
    add_p(doc, "Ser una persona física o moral con plena capacidad jurídica para contratar, interesada en optimizar sus canales de atención y procesos de negocio mediante los agentes y tecnología de EL PRESTADOR.", "II. Declara EL CLIENTE: ")
    
    add_heading2(doc, "CLÁUSULAS")
    add_p(doc, "EL PRESTADOR se obliga a diseñar, configurar, entrenar, desplegar y mantener en operación uno o más agentes de Inteligencia Artificial conforme al Plan contratado (Growth, Scale o Enterprise), integrando la base de conocimientos con la documentación oficial provista por EL CLIENTE.", "PRIMERA. OBJETO DEL CONVENIO: ")
    
    add_p(doc, "El Costo de Implementación (Setup) se liquidará 50% (cincuenta por ciento) como anticipo a la firma para iniciar trabajos y 50% (cincuenta por ciento) al momento del pase a producción y entrega de accesos. La Suscripción Mensual (MRR) cubre la disponibilidad de plataforma, inferencia de tokens de IA bajo uso razonable, alojamiento en servidores dedicados, mantenimiento preventivo de hasta 2 horas mensuales y monitoreo continuo.", "SEGUNDA. CONTRAPRESTACIÓN Y PAGOS: ")
    
    add_p(doc, "Ambas partes reconocen que Meta Platforms Inc. opera como un proveedor de telecomunicaciones independiente. Por ende: (a) EL CLIENTE es titular exclusivo de su línea telefónica y de su cuenta de Meta Business Suite; (b) Los consumos de mensajería generados ante Meta ($0.0085 USD por mensaje de servicio superados los 1,000 mensuales) se cargarán directamente a la tarjeta registrada por EL CLIENTE; (c) EL PRESTADOR no retiene margen alguno sobre Meta ni asume responsabilidad por adeudos o bloqueos derivados de incumplimientos del CLIENTE ante Meta.", "TERCERA. DELIMITACIÓN DE TARIFAS DE META: ")
    
    add_p(doc, "EL CLIENTE conserva en todo momento la titularidad y propiedad exclusiva sobre sus bases de datos, contactos, conversaciones y documentos corporativos. EL PRESTADOR tratará dicha información con estricta confidencialidad y apego a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).", "CUARTA. SOBERANÍA DE DATOS Y CONFIDENCIALIDAD: ")
    
    add_p(doc, "El código fuente base, algoritmos de orquestación, arquitectura determinista y la plataforma tecnológica Valentina AI son propiedad intelectual exclusiva de EL PRESTADOR. Se concede al CLIENTE una licencia de uso no exclusiva y revocable mientras mantenga vigente su suscripción mensual.", "QUINTA. PROPIEDAD INTELECTUAL DEL SOFTWARE: ")
    
    add_p(doc, "EL PRESTADOR garantiza una disponibilidad anual de infraestructura del 99.9% (excluyendo caídas globales de Meta o ventanas programadas de mantenimiento). El tiempo máximo de respuesta para soporte técnico es de 12 horas hábiles en planes Growth y Scale, y de 4 horas para Enterprise.", "SEXTA. NIVELES DE SERVICIO (SLA): ")
    
    add_p(doc, "Durante los primeros 30 días naturales posteriores al despliegue, EL PRESTADOR efectuará las calibraciones y ajustes necesarios sin costo adicional hasta alcanzar más del 80% de resolución autónoma sobre consultas recurrentes.", "SÉPTIMA. GARANTÍA DE CALIBRACIÓN: ")
    
    add_p(doc, "Salvo contratación anual formalizada, el servicio opera de manera mensual. EL CLIENTE podrá solicitar la terminación del servicio con al menos 30 días de anticipación al siguiente corte, procediendo a la entrega de respaldo íntegro y borrado seguro de la bóveda digital.", "OCTAVA. VIGENCIA Y TERMINACIÓN: ")
    
    add_p(doc, "Para la interpretación y cumplimiento de este instrumento, las partes se someten a la jurisdicción de los tribunales competentes de la ciudad de Santiago de Querétaro, Querétaro, renunciando a cualquier otro fuero.", "NOVENA. JURISDICCIÓN: ")
    
    # Carátula de Contratación
    add_heading2(doc, "CARÁTULA DE CONTRATACIÓN (COMPLEMENTO)")
    c_tbl = doc.add_table(rows=3, cols=2)
    c_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    c_tbl.autofit = False
    set_table_borders(c_tbl)
    
    for row in c_tbl.rows:
        row.cells[0].width = Inches(3.2)
        row.cells[1].width = Inches(3.3)
        
    fields = [
        ("EMPRESA / RAZÓN SOCIAL: ___________________", "RFC: ___________________________________"),
        ("PLAN SELECCIONADO: [ ] Growth  [ ] Scale  [ ] Enterprise", "MODALIDAD: [ ] Mensual  [ ] Anual (Ahorro 2M)"),
        ("SETUP ACORDADO: $_________________ MXN", "MENSUALIDAD: $_________________ MXN / mes")
    ]
    for r_i, (f1, f2) in enumerate(fields):
        c1, c2 = c_tbl.cell(r_i, 0), c_tbl.cell(r_i, 1)
        set_cell_shading(c1, HEX_ROW_EVEN)
        set_cell_shading(c2, HEX_ROW_EVEN)
        set_cell_margins(c1, 80, 80, 100, 100)
        set_cell_margins(c2, 80, 80, 100, 100)
        c1.paragraphs[0].add_run(f1).font.size = Pt(8.5)
        c2.paragraphs[0].add_run(f2).font.size = Pt(8.5)
        
    add_signatures(doc, "VALENTINA AI S.A.S.", "Ingeniería & Representante Autorizado", "EL CLIENTE / RAZÓN SOCIAL", "Acepto los Términos y Condiciones Legales")
    
    filepath = os.path.join(OUTPUT_DIR, "Convenio_Comercial_Servicios_IA_Valentina_AI.docx")
    doc.save(filepath)
    print(f"Generado: {filepath}")

# ==============================================================================
# 4. GENERAR: Anexo_A_Prerrequisitos_y_Matriz_RACI_Valentina_AI.docx
# ==============================================================================
def generate_anexo_raci():
    doc = docx.Document()
    setup_letterhead_page(doc, "REF: ANX-RACI-2026-VAL")
    
    add_title_block(
        doc,
        "Anexo Técnico A-01",
        "Prerrequisitos del Cliente & Matriz de Responsabilidades (RACI)",
        "Procedimiento de entrega de insumos técnicos para asegurar un despliegue ágil en 10 a 21 días hábiles."
    )
    
    add_callout(
        doc,
        "Objetivo del Anexo: Cero Demoras en el Despliegue",
        "El 90% de los atrasos en proyectos de IA se deben a demoras en la preparación del número telefónico o en la verificación de Meta. Cumplir este checklist al firmar garantiza el cumplimiento exacto del cronograma acordado.",
        HEX_PURPLE_BG,
        HEX_PURPLE_BORDER,
        "⏱"
    )
    
    add_heading2(doc, "1. Checklist de Insumos Obligatorios a Cargo del Cliente")
    add_p(doc, "Número exclusivo para el asistente. Si el número estuvo registrado en WhatsApp personal o Business en un celular, debe eliminarse de la aplicación móvil para recibir el PIN de verificación por SMS o llamada mediante la API oficial de Meta.", "1. Línea Telefónica para WhatsApp: ")
    add_p(doc, "Acceso de Administrador a Meta Business Suite y tarjeta bancaria vinculada en el módulo de pagos de Meta para la liquidación directa de los mensajes ($0.0085 USD/mensaje a partir de octubre 2026).", "2. Cuenta y Tarjeta en Meta Business: ")
    add_p(doc, "PDFs, manuales de servicios, catálogo de productos con precios vigentes, políticas comerciales y respuestas a las 20 preguntas más frecuentes de los clientes.", "3. Documentación Oficial y Catálogo: ")
    add_p(doc, "En Plan Scale o Enterprise: credenciales de API o webhooks de Google Calendar, Cal.com, HubSpot o accesos de solo lectura para bases de datos ERP.", "4. Accesos de Integración: ")
    
    add_heading2(doc, "2. Matriz de Responsabilidades (RACI) por Etapa del Proyecto")
    
    r_tbl = doc.add_table(rows=6, cols=4)
    r_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    r_tbl.autofit = False
    set_table_borders(r_tbl)
    
    rw = [Inches(2.0), Inches(1.2), Inches(1.2), Inches(2.1)]
    for row in r_tbl.rows:
        for i, w in enumerate(rw):
            row.cells[i].width = w
            
    r_headers = ["Etapa del Proyecto", "Valentina AI", "El Cliente", "Entregable / Criterio de Éxito"]
    for i, title in enumerate(r_headers):
        cell = r_tbl.cell(0, i)
        set_cell_shading(cell, HEX_HEADER_BG)
        set_cell_margins(cell, 120, 120, 120, 120)
        p = cell.paragraphs[0]
        r = p.add_run(title)
        r.font.name = "Arial"
        r.font.size = Pt(8.5)
        r.font.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)
        
    r_data = [
        ["1. Diagnóstico & Arquitectura", "Responsable", "Informa / Consulta", "Mapa de intenciones y diagrama de flujo."],
        ["2. Provisión de Insumos & Meta", "Guía técnica", "Responsable", "Número listo y tarjeta vinculada en Meta."],
        ["3. Ingeniería, RAG & Guardrails", "Responsable", "Supervisa", "Indexación documental y pruebas internas."],
        ["4. Calibración en Staging", "Responsable", "Aprueba", "30 consultas reales validadas por el cliente."],
        ["5. Despliegue en Vivo & Capacitación", "Responsable", "Participa", "Pase a producción y sesión ejecutiva (1 hr)."]
    ]
    
    for row_idx, row_data in enumerate(r_data, start=1):
        shading = HEX_ROW_EVEN if row_idx % 2 == 0 else "FFFFFF"
        for col_idx, text in enumerate(row_data):
            cell = r_tbl.cell(row_idx, col_idx)
            set_cell_shading(cell, shading)
            set_cell_margins(cell, 90, 90, 110, 110)
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            r = p.add_run(text)
            r.font.name = "Calibri"
            r.font.size = Pt(8.5)
            if col_idx in (1, 2) and text in ("Responsable", "Aprueba"):
                r.font.bold = True
                r.font.color.rgb = C_IRIS if col_idx == 1 else C_EMERALD
            else:
                r.font.color.rgb = C_DARK
                
    p_sp3 = doc.add_paragraph()
    p_sp3.paragraph_format.space_before = Pt(6)
    p_sp3.paragraph_format.space_after = Pt(2)
    
    add_callout(
        doc,
        "Cómputo de Tiempos de Entrega",
        "El plazo de despliegue comprometido (10 a 14 días para Growth; 15 a 21 días para Scale) comenzará a contabilizarse formalmente a partir del día hábil siguiente a aquel en que el cliente complete la entrega de la documentación y concluya la vinculación de su número en Meta.",
        HEX_GREEN_BG,
        HEX_GREEN_BORDER,
        "✔"
    )
    
    add_signatures(doc, "LÍDER DE ONBOARDING", "Valentina AI Studio", "RESPONSABLE OPERATIVO", "Organización Contratante")
    
    filepath = os.path.join(OUTPUT_DIR, "Anexo_A_Prerrequisitos_y_Matriz_RACI_Valentina_AI.docx")
    doc.save(filepath)
    print(f"Generado: {filepath}")

if __name__ == "__main__":
    print("Iniciando generación de documentos Word (.docx)...")
    generate_hoja_membretada()
    generate_politica_precios()
    generate_convenio_servicios()
    generate_anexo_raci()
    print("Todos los documentos Word han sido generados exitosamente.")
