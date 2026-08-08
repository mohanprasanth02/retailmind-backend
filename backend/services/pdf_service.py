import os
import qrcode
from io import BytesIO
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_invoice_pdf(order: dict, output_path: str):
    """
    Generates a beautiful PDF invoice for the given order dictionary.
    Saves it to output_path.
    """
    # Ensure directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # 1. Setup Document
    doc = SimpleDocTemplate(
        output_path, 
        pagesize=letter,
        rightMargin=36, 
        leftMargin=36, 
        topMargin=36, 
        bottomMargin=36
    )
    
    story = []
    styles = getSampleStyleSheet()
    
    # 2. Styles
    # Create dark-themed accent styling
    primary_color = colors.HexColor("#0f172a") # Slate 900
    accent_color = colors.HexColor("#06b6d4")  # Cyan 500
    text_color = colors.HexColor("#334155")    # Slate 700
    bg_light = colors.HexColor("#f8fafc")      # Slate 50
    
    title_style = ParagraphStyle(
        'InvoiceTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        textColor=primary_color,
        spaceAfter=6
    )
    
    subtitle_style = ParagraphStyle(
        'InvoiceSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=colors.HexColor("#64748b"),
        spaceAfter=15
    )
    
    header_right_style = ParagraphStyle(
        'HeaderRight',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=text_color,
        alignment=2 # Right aligned
    )
    
    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        textColor=primary_color,
        spaceAfter=6,
        spaceBefore=10
    )
    
    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        textColor=text_color,
        leading=13
    )
    
    bold_body_style = ParagraphStyle(
        'BoldBodyTextCustom',
        parent=body_style,
        fontName='Helvetica-Bold'
    )

    right_align_body = ParagraphStyle(
        'RightAlignBody',
        parent=body_style,
        alignment=2
    )

    # 3. Header Section (Two-column: Brand on left, Invoice metadata on right)
    brand_p = Paragraph(f"<b><font color='{accent_color.hexval()}'>RetailMind AI</font></b><br/>Company Brain for Smart Retail", title_style)
    subbrand_p = Paragraph("Smart Retail Automated System<br/>Email: support@retailmind.ai | Phone: +1-800-RETAIL", subtitle_style)
    
    order_id = order.get("orderId", "N/A")
    # Take first 8 chars for display if too long
    short_order_id = order_id[:8] if len(order_id) > 8 else order_id
    
    timestamp = order.get("timestamp")
    date_str = ""
    if timestamp:
        try:
            # Handle float/int timestamp, string, or dict from Firebase
            if isinstance(timestamp, (int, float)):
                date_str = datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d %I:%M %p")
            elif isinstance(timestamp, dict) and "_seconds" in timestamp:
                date_str = datetime.fromtimestamp(timestamp["_seconds"]).strftime("%Y-%m-%d %I:%M %p")
            else:
                date_str = str(timestamp)[:16]
        except Exception:
            date_str = datetime.now().strftime("%Y-%m-%d %I:%M %p")
    else:
        date_str = datetime.now().strftime("%Y-%m-%d %I:%M %p")
        
    meta_p = Paragraph(
        f"<b>INVOICE #INV-{short_order_id}</b><br/>"
        f"Date: {date_str}<br/>"
        f"Platform: {order.get('platform', 'Direct').upper()}<br/>"
        f"Status: <b><font color='{accent_color.hexval()}'>{order.get('status', 'Pending').upper()}</font></b>", 
        header_right_style
    )
    
    header_table = Table([[brand_p, meta_p]], colWidths=[300, 240])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 10))
    
    # 4. Bill To & Bill From Section (Horizontal alignment)
    bill_from_text = (
        "<b>From:</b><br/>"
        "RetailMind Store HQ<br/>"
        "100 Innovation Way, Cyber City<br/>"
        "GSTIN: 22AAAAA0000A1Z5"
    )
    
    customer_name = order.get("customerName", "Valued Customer")
    phone = order.get("phone", "N/A")
    address = order.get("address", "N/A")
    
    bill_to_text = (
        f"<b>Bill To:</b><br/>"
        f"{customer_name}<br/>"
        f"Phone: {phone}<br/>"
        f"Address: {address}"
    )
    
    from_p = Paragraph(bill_from_text, body_style)
    to_p = Paragraph(bill_to_text, body_style)
    
    billing_table = Table([[from_p, to_p]], colWidths=[270, 270])
    billing_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BACKGROUND', (0, 0), (-1, -1), bg_light),
        ('PADDING', (0, 0), (-1, -1), 10),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
    ]))
    story.append(billing_table)
    story.append(Spacer(1, 15))
    
    # 5. Items Table Header
    story.append(Paragraph("Order Items", section_heading))
    
    # Products Data
    table_data = [
        [
            Paragraph("<b>Item Name</b>", bold_body_style),
            Paragraph("<b>Qty</b>", bold_body_style),
            Paragraph("<b>Unit Price</b>", bold_body_style),
            Paragraph("<b>Total Price</b>", bold_body_style)
        ]
    ]
    
    subtotal = order.get("subtotal", 0.0)
    gst = order.get("gst", 0.0)
    total = order.get("total", 0.0)
    products_list = order.get("products", [])
    
    # Fill items
    item_subtotal = 0.0
    for prod in products_list:
        p_name = prod.get("name", "Unknown Item")
        p_qty = prod.get("quantity", 1)
        p_price = prod.get("price", 0.0)
        
        # Calculate row total
        p_total = p_price * p_qty
        item_subtotal += p_total
        
        table_data.append([
            Paragraph(p_name, body_style),
            Paragraph(str(p_qty), right_align_body),
            Paragraph(f"${p_price:,.2f}", right_align_body),
            Paragraph(f"${p_total:,.2f}", right_align_body)
        ])
        
    # Re-calculate subtotal/gst/total if values in order are 0
    if subtotal == 0:
        subtotal = item_subtotal
    if gst == 0:
        gst = subtotal * 0.18
    if total == 0:
        total = subtotal + gst
        
    items_table = Table(table_data, colWidths=[260, 50, 110, 120])
    items_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('LINEBELOW', (0, 0), (-1, 0), 1.5, primary_color),
        ('LINEBELOW', (0, 1), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, bg_light]),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 15))
    
    # 6. Calculations & QR Code Section (Two-column: QR left, Totals right)
    # Generate QR Code
    qr_data = f"RetailMindAI:INV-{short_order_id}|Total:${total:.2f}"
    qr = qrcode.QRCode(version=1, box_size=3, border=2)
    qr.add_data(qr_data)
    qr.make(fit=True)
    img_qr = qr.make_image(fill_color="black", back_color="white")
    
    # Save QR code to bytes buffer
    buffer = BytesIO()
    img_qr.save(buffer, format='PNG')
    buffer.seek(0)
    qr_flowable = Image(buffer, width=70, height=70)
    
    qr_desc = Paragraph(
        "<font size='7' color='#64748b'>Scan QR to verify invoice authenticity & authorize payment gateway transfer.</font>", 
        body_style
    )
    
    qr_table = Table([[qr_flowable, qr_desc]], colWidths=[80, 140])
    qr_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))

    # Totals column
    total_data = [
        [Paragraph("Subtotal:", body_style), Paragraph(f"${subtotal:,.2f}", right_align_body)],
        [Paragraph("GST (18%):", body_style), Paragraph(f"${gst:,.2f}", right_align_body)],
        [Paragraph("<b>Grand Total:</b>", bold_body_style), Paragraph(f"<b>${total:,.2f}</b>", right_align_body)]
    ]
    totals_table = Table(total_data, colWidths=[140, 140])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('LINEABOVE', (0, 2), (1, 2), 1, primary_color),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
    ]))
    
    footer_row_table = Table([[qr_table, totals_table]], colWidths=[260, 280])
    footer_row_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    
    story.append(KeepTogether([
        Spacer(1, 10),
        footer_row_table,
        Spacer(1, 30),
        Paragraph("Thank you for your business with RetailMind AI!", ParagraphStyle('Centred', parent=body_style, alignment=1)),

    ]))
    
    # Build Document
    doc.build(story)
