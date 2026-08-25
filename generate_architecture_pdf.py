import os
import sys
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_decorations(self, page_count):
        if self._pageNumber == 1:
            # First page cover decoration
            self.saveState()
            self.setFillColor(colors.HexColor("#007AFF"))
            self.rect(0, 782, 612, 10, fill=True, stroke=False)
            self.restoreState()
            return
        
        self.saveState()
        self.setFont("Helvetica-Bold", 7.5)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Header
        self.drawString(36, 758, "RETAILMIND AI — DATABASE ARCHITECTURE & RENDERING PIPELINE")
        self.setFont("Helvetica", 7.5)
        self.drawRightString(576, 758, "Technical Specification & Systems Manual")
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.6)
        self.line(36, 752, 576, 752)
        
        # Footer
        self.line(36, 42, 576, 42)
        self.drawString(36, 30, "Confidential — RetailMind Architecture & Full-Stack Schema Reference")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(576, 30, page_str)
        self.restoreState()

def build_pdf(filename="RetailMind_AI_Database_Architecture_And_Pipeline.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=50,
        bottomMargin=50
    )

    styles = getSampleStyleSheet()
    
    # Custom Brand Typography Styles
    c_primary = colors.HexColor("#007AFF")    # Apple System Blue
    c_dark = colors.HexColor("#0F172A")       # Slate 900
    c_slate = colors.HexColor("#334155")      # Slate 700
    c_muted = colors.HexColor("#64748B")      # Slate 500
    c_bg_light = colors.HexColor("#F8FAFC")   # Slate 50
    c_border = colors.HexColor("#E2E8F0")     # Slate 200
    c_success = colors.HexColor("#10B981")    # Emerald Green
    c_warning = colors.HexColor("#F59E0B")    # Amber Orange
    
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=23,
        leading=28,
        textColor=c_dark,
        spaceAfter=6
    )
    
    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=16,
        textColor=c_muted,
        spaceAfter=14
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=c_primary,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=c_dark,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.5,
        textColor=c_slate,
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.5,
        textColor=c_slate,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=3
    )

    code_style = ParagraphStyle(
        'Code_Custom',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7.5,
        leading=10.5,
        textColor=colors.HexColor("#0F172A"),
        spaceAfter=4
    )

    callout_style = ParagraphStyle(
        'Callout_Text',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8.2,
        leading=12,
        textColor=colors.HexColor("#1E293B")
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.white
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.8,
        leading=10.5,
        textColor=c_slate
    )

    table_code_style = ParagraphStyle(
        'TableCode',
        parent=styles['Normal'],
        fontName='Courier-Bold',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor("#0284C7")
    )

    story = []

    # ── HEADER BLOCK ────────────────────────────────────────────────────────
    story.append(Spacer(1, 10))
    story.append(Paragraph("RETAILMIND AI • MASTER TECHNICAL ARCHITECTURE", ParagraphStyle(
        'Badge', fontName='Helvetica-Bold', fontSize=8, leading=10, textColor=c_primary, spaceAfter=4
    )))
    story.append(Paragraph("Database Architecture, Product Storage Schema &amp; Frontend Rendering Pipeline", title_style))
    story.append(Paragraph("End-to-End Technical Whitepaper &amp; System Integration Manual • Version 3.4 • Generated: " + datetime.now().strftime("%B %d, %Y"), subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=c_primary, spaceBefore=0, spaceAfter=14))

    # ── CALLOUT BOX: ARCHITECTURE SNAPSHOT ──────────────────────────────────
    snapshot_html = "<b>Core Architecture Summary:</b> RetailMind operates a high-speed, dual-mode persistence architecture: Google Cloud Firestore provides real-time distributed NoSQL synchronization in production, with seamless zero-dependency fallback to an in-memory/JSON-persisted FastAPI database engine (<code>mock_db.py</code>). Product catalogs sync bidirectionally across web (React 19) and mobile (Flutter) clients with millisecond latency."
    snapshot_table = Table([[Paragraph(snapshot_html, callout_style)]], colWidths=[540])
    snapshot_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#EFF6FF")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#BFDBFE")),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(snapshot_table)
    story.append(Spacer(1, 14))

    # ── SECTION 1: EXECUTIVE SUMMARY & DUAL-DATABASE ARCHITECTURE ───────────
    story.append(Paragraph("1. Executive Summary &amp; Dual-Database Architecture", h1_style))
    story.append(Paragraph(
        "RetailMind AI eliminates vendor lock-in and cold-start network latency through a dynamic dual-layer storage abstraction. "
        "The system runs in two deterministic operational modes without changing a single line of client UI code:", body_style
    ))

    db_modes_data = [
        [Paragraph("Mode Layer", table_header_style), Paragraph("Engine / Mechanism", table_header_style), Paragraph("Behavior &amp; Persistence", table_header_style), Paragraph("Primary Use Case", table_header_style)],
        [
            Paragraph("<b>Production Mode</b>", table_cell_style),
            Paragraph("Google Cloud Firestore (NoSQL)", table_code_style),
            Paragraph("Global ACID document transactions, real-time snapshot streams, automatic clustering.", table_cell_style),
            Paragraph("Multi-device live syncing &amp; production deployments.", table_cell_style)
        ],
        [
            Paragraph("<b>Fallback / Mock Mode</b>", table_cell_style),
            Paragraph("FastAPI in-memory + JSON disk", table_code_style),
            Paragraph("Pre-seeded Python dictionaries mirrored to <code>data/registered_customers.json</code>.", table_cell_style),
            Paragraph("Zero-config local development, testing, &amp; offline resilience.", table_cell_style)
        ]
    ]
    t_db = Table(db_modes_data, colWidths=[95, 125, 200, 120])
    t_db.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_primary),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, c_bg_light]),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(t_db)
    story.append(Spacer(1, 8))

    story.append(Paragraph("Automatic Database Detection &amp; Failover Logic:", h2_style))
    story.append(Paragraph("• <b>Environment Flag Probing:</b> Upon boot, <code>config.py</code> inspects <code>USE_MOCK_DB</code> and verifies service certificate files.", bullet_style))
    story.append(Paragraph("• <b>Graceful Exception Interception:</b> If Firebase credentials are placeholders or network sockets time out, the backend auto-falls back to Mock DB and logs <code>[Firebase] Initialization failed. Forcing Mock DB Mode</code>.", bullet_style))
    story.append(Paragraph("• <b>Health Status Broadcast:</b> The <code>GET /api/status</code> endpoint returns active database telemetry (<code>{ 'mock_db': true/false, 'status': 'online' }</code>) so clients adjust polling vs. streaming dynamically.", bullet_style))
    story.append(Spacer(1, 10))

    # ── SECTION 2: COMPLETE DATABASE SCHEMA & DATA MODEL ─────────────────────
    story.append(Paragraph("2. Complete Database Schema &amp; Product Data Model", h1_style))
    story.append(Paragraph(
        "Product entities represent the core commercial catalog in RetailMind. Every item is strongly typed in Pydantic models (backend) "
        "and mapped to document records in Firestore or JSON dictionaries in memory:", body_style
    ))

    schema_data = [
        [Paragraph("Field Name", table_header_style), Paragraph("Data Type", table_header_style), Paragraph("Constraints &amp; Default", table_header_style), Paragraph("Functional Description", table_header_style)],
        [Paragraph("productId", table_code_style), Paragraph("String", table_cell_style), Paragraph("PK, Auto-UUID (<code>prod_...</code>)", table_cell_style), Paragraph("Unique immutable product identifier.", table_cell_style)],
        [Paragraph("name", table_code_style), Paragraph("String", table_cell_style), Paragraph("Required, Max 120 chars", table_cell_style), Paragraph("Commercial product title displayed on UI.", table_cell_style)],
        [Paragraph("category", table_code_style), Paragraph("String", table_cell_style), Paragraph("Required (Electronics, etc.)", table_cell_style), Paragraph("Taxonomic grouping used in frontend filters.", table_cell_style)],
        [Paragraph("price", table_code_style), Paragraph("Float (Float64)", table_cell_style), Paragraph("&gt;= 0.00, 2 decimal precision", table_cell_style), Paragraph("Base selling price in localized currency (₹/$) .", table_cell_style)],
        [Paragraph("stock", table_code_style), Paragraph("Integer (Int32)", table_cell_style), Paragraph("&gt;= 0, Default: 0", table_cell_style), Paragraph("Live stock quantity; triggers low-stock alerts if &lt; 10.", table_cell_style)],
        [Paragraph("sku", table_code_style), Paragraph("String", table_cell_style), Paragraph("Unique Barcode/SKU string", table_cell_style), Paragraph("Stock Keeping Unit code for inventory tracking.", table_cell_style)],
        [Paragraph("supplier", table_code_style), Paragraph("String", table_cell_style), Paragraph("Optional, Default: ''", table_cell_style), Paragraph("Vendor/Supplier distribution partner name.", table_cell_style)],
        [Paragraph("image", table_code_style), Paragraph("String (URL)", table_cell_style), Paragraph("Fallback Unsplash CDN URL", table_cell_style), Paragraph("High-resolution product thumbnail representation.", table_cell_style)],
        [Paragraph("createdAt", table_code_style), Paragraph("Timestamp / Float", table_cell_style), Paragraph("Server Timestamp (time.time())", table_cell_style), Paragraph("Creation timestamp for sorting &amp; analytics.", table_cell_style)],
    ]
    t_schema = Table(schema_data, colWidths=[85, 75, 140, 240])
    t_schema.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1E293B")),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, c_bg_light]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_schema)
    story.append(Spacer(1, 8))

    story.append(Paragraph("Relational Linkages &amp; Cross-Entity Indexing:", h2_style))
    story.append(Paragraph("• <b>Orders (<code>OrderProductModel</code>):</b> Embedded line-item sub-array referencing <code>name</code>, <code>quantity</code>, and frozen transaction <code>price</code> at checkout time to preserve accounting history.", bullet_style))
    story.append(Paragraph("• <b>Audit Trail (<code>activity_logs</code>):</b> Every product creation, stock adjustment, or deletion automatically writes an immutable log record with timestamp and executing user ID.", bullet_style))
    story.append(Paragraph("• <b>Low Stock Notification Queue:</b> Adjusting stock below threshold (10 units) automatically synthesizes a high-priority entry into the notification table.", bullet_style))
    story.append(Spacer(1, 10))

    # ── SECTION 3: BACKEND API & DATA LIFECYCLE ─────────────────────────────
    story.append(Paragraph("3. Backend API Architecture &amp; Lifecycle Operations", h1_style))
    story.append(Paragraph(
        "The FastAPI backend provides non-blocking async endpoint handlers with automatic Pydantic request validation and CORS middleware:", body_style
    ))

    api_endpoints = [
        [Paragraph("Method &amp; Endpoint", table_header_style), Paragraph("Input Payload / Query", table_header_style), Paragraph("Response Code", table_header_style), Paragraph("Lifecycle Action", table_header_style)],
        [
            Paragraph("<b>GET</b> <code>/api/products</code>", table_cell_style),
            Paragraph("<code>?category=...&amp;search=...</code>", table_code_style),
            Paragraph("<code>200 OK</code>", table_cell_style),
            Paragraph("Queries collection, filters in-memory/Firestore, returns Product array.", table_cell_style)
        ],
        [
            Paragraph("<b>POST</b> <code>/api/products</code>", table_cell_style),
            Paragraph("<code>ProductModel</code> (JSON)", table_code_style),
            Paragraph("<code>200 / 201</code>", table_cell_style),
            Paragraph("Generates UUID <code>prod_...</code>, seeds default image if blank, appends audit log.", table_cell_style)
        ],
        [
            Paragraph("<b>PUT</b> <code>/api/products/{id}</code>", table_cell_style),
            Paragraph("<code>ProductModel</code> (JSON)", table_code_style),
            Paragraph("<code>200 / 404</code>", table_cell_style),
            Paragraph("Updates product entity, recalculates inventory mirror, logs change.", table_cell_style)
        ],
        [
            Paragraph("<b>PUT</b> <code>/api/inventory/{id}</code>", table_cell_style),
            Paragraph("<code>{ stock: int }</code>", table_code_style),
            Paragraph("<code>200 / 404</code>", table_cell_style),
            Paragraph("Adjusts stock level; triggers instant Low Stock Alert if stock &lt; 10.", table_cell_style)
        ],
        [
            Paragraph("<b>DELETE</b> <code>/api/products/{id}</code>", table_cell_style),
            Paragraph("URL Path Param <code>product_id</code>", table_code_style),
            Paragraph("<code>200 / 404</code>", table_cell_style),
            Paragraph("Deletes document from Firestore/memory and registers removal in audit trail.", table_cell_style)
        ]
    ]
    t_api = Table(api_endpoints, colWidths=[125, 140, 75, 200])
    t_api.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_primary),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, c_bg_light]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_api)
    story.append(Spacer(1, 10))

    # ── SECTION 4: REACT WEB FRONTEND DATA FLOW ─────────────────────────────
    story.append(Paragraph("4. React Web Frontend Data Flow &amp; Display Pipeline", h1_style))
    story.append(Paragraph(
        "The React 19 web dashboard (<code>web/src/pages/Products.jsx</code>) implements Apple-standard vibrancy design with ultra-low latency rendering:", body_style
    ))

    story.append(Paragraph("• <b>Dual Listener Mechanism:</b> When Firebase credentials are set, the UI attaches Firestore <code>onSnapshot(collection(db, 'products'))</code> for zero-latency reactive updates. When running on Mock API, it uses high-frequency background polling (<code>fetch('${API_BASE_URL}/api/products')</code>).", bullet_style))
    story.append(Paragraph("• <b>Stock Status Badge Calculation:</b> Stock thresholds determine dynamic status chips in real time:", bullet_style))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;– <b>In Stock (Green):</b> <code>stock &gt;= 20</code> (Active indicator: <code>#34C759</code>)", bullet_style))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;– <b>Medium Stock (Amber):</b> <code>10 &lt;= stock &lt; 20</code> (Warning indicator: <code>#FF9500</code>)", bullet_style))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;– <b>Low Stock (Crimson):</b> <code>stock &lt; 10</code> (Urgent alert: <code>#FF3B30</code>)", bullet_style))
    story.append(Paragraph("• <b>Dynamic Currency Transformation:</b> The <code>formatPrice()</code> utility dynamically formats raw numerical integers/floats into localized currency strings (e.g. <code>₹1,24,999.00</code> or <code>$1,499.00</code>) based on store settings.", bullet_style))
    story.append(Paragraph("• <b>Fluid Search &amp; Category Filters:</b> Filtering occurs instantaneously in memory across SKU, name, and category tabs with Framer Motion spring micro-animations.", bullet_style))
    story.append(Spacer(1, 10))

    # ── SECTION 5: FLUTTER MOBILE APP INTEGRATION ───────────────────────────
    story.append(Paragraph("5. Flutter Mobile Client Architecture (Android/iOS/Web)", h1_style))
    story.append(Paragraph(
        "The Flutter mobile app (<code>mobile/lib/services/firebase_service.dart</code>) handles cross-platform multi-environment discovery:", body_style
    ))

    story.append(Paragraph("• <b>Dynamic Backend Detector (<code>detectBackend()</code>):</b> Probes available candidate endpoints in sequence (Cloud Hosted Render URL &rarr; LAN Wi-Fi IP &rarr; Android Emulator IP <code>10.0.2.2</code> &rarr; Localhost) and locks onto the first healthy responder.", bullet_style))
    story.append(Paragraph("• <b>Offline Caching with SharedPreferences:</b> Cart items and custom backend endpoints persist locally across restarts, enabling customer ordering even during intermittent connectivity drops.", bullet_style))
    story.append(Paragraph("• <b>Customer Sync Engine:</b> Profile registrations automatically post to <code>/api/customers</code>, linking mobile orders directly to the web dashboard.", bullet_style))
    story.append(Spacer(1, 10))

    # ── SECTION 6: SEQUENCE DIAGRAM & END-TO-END DATA FLOW ──────────────────
    story.append(Paragraph("6. End-to-End Product Lifecycle &amp; Sync Walkthrough", h1_style))
    
    flow_diagram = """
+-------------------------+       1. POST /api/products      +-------------------------+
|   React Web Dashboard   | -------------------------------> |   FastAPI Cloud Core    |
| (Store Admin Console)   |                                  |   (Render / Local)      |
+-------------------------+                                  +-------------------------+
            ^                                                             |
            |                                                             | 2. Write Document
            | 4. WebSocket / Firestore Snapshot                           v
            +----------------------------------------------- +-------------------------+
            |                                                | Google Cloud Firestore  |
            v                                                |   OR in-memory Mock DB  |
+-------------------------+       3. Live Stream / Polling   +-------------------------+
|   Flutter Mobile App    | <---------------------------------------------+
|   (Customer Client)     |
+-------------------------+
"""
    story.append(Paragraph("<b>End-to-End Sequence Walkthrough:</b>", h2_style))
    story.append(Table([[Paragraph(f"<pre>{flow_diagram}</pre>", code_style)]], colWidths=[540], style=[
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F1F5F9")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#CBD5E1")),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(Spacer(1, 8))

    story.append(Paragraph("• <b>Step 1 (Mutation):</b> Admin creates/modifies a product via React UI &rarr; dispatches JSON to <code>POST/PUT /api/products</code>.", bullet_style))
    story.append(Paragraph("• <b>Step 2 (Persistence &amp; Automation):</b> Backend validates payload, writes to Firestore/Mock DB, adjusts inventory mirroring, and generates audit log entry.", bullet_style))
    story.append(Paragraph("• <b>Step 3 (Event Notification):</b> If stock count drops below 10, backend synthesizes a low-stock alert in the notification queue.", bullet_style))
    story.append(Paragraph("• <b>Step 4 (Multi-Client Push):</b> Firestore snapshot listeners fire across both Web and Mobile apps, updating product lists and stock badges instantly without requiring page reloads.", bullet_style))

    # Build document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"[PDF Generator] Successfully generated: {filename}")

if __name__ == "__main__":
    output_pdf = sys.argv[1] if len(sys.argv) > 1 else "RetailMind_AI_Database_Architecture_And_Pipeline.pdf"
    build_pdf(output_pdf)
