import os
import time
import uuid
import csv
import json
from io import StringIO
from fastapi import FastAPI, HTTPException, Response, Query
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

import config as config
import mock_db as mdb
from services.pdf_service import generate_invoice_pdf
from services.ai_service import get_business_answer
from services.firestore_listener import start_firestore_listener

# Path to persist registered customers across restarts (mock mode)
CUSTOMERS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "registered_customers.json")

# 1. Initialize Firebase Admin SDK if not in mock mode
db = None
if not config.USE_MOCK_DB:
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore
        
        if not firebase_admin._apps:
            creds = credentials.Certificate(config.FIREBASE_CREDENTIALS)
            firebase_admin.initialize_app(creds)
            print("[Firebase] Admin SDK initialized successfully.")
        db = firestore.client()
    except Exception as e:
        print(f"[Firebase] Initialization failed: {e}. Forcing Mock DB Mode.")
        config.USE_MOCK_DB = True
        config.USE_MOCK_AI = True

app = FastAPI(title="RetailMind AI Backend", version="1.0.0")

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for dev simplicity
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Pydantic Models for requests
class ProductModel(BaseModel):
    name: str
    category: str
    price: float
    stock: int
    image: Optional[str] = ""
    sku: Optional[str] = ""
    supplier: Optional[str] = ""

class StockAdjustModel(BaseModel):
    stock: int

class OrderProductModel(BaseModel):
    name: str
    quantity: int
    price: Optional[float] = 0.0

class OrderCreateModel(BaseModel):
    customerName: str
    phone: str
    address: str
    platform: str # whatsapp, instagram, website, email
    message: Optional[str] = ""
    products: Optional[List[OrderProductModel]] = []
    customerId: Optional[str] = ""  # real user UID from mobile registration

class OrderStatusUpdateModel(BaseModel):
    status: str # Pending, Processing, Completed, Rejected

class ChatQuestionModel(BaseModel):
    question: str

class RegisterUserModel(BaseModel):
    uid: str
    name: str
    email: str
    phone: Optional[str] = ""
    role: Optional[str] = "customer"

# 3. Seed Firestore Database if empty
@app.on_event("startup")
async def startup_event():
    print("[Startup] Running initialization tasks...")

    # Load persisted customers from disk (mock mode) so registrations survive restarts
    if config.USE_MOCK_DB:
        try:
            if os.path.exists(CUSTOMERS_FILE):
                with open(CUSTOMERS_FILE, "r", encoding="utf-8") as f:
                    saved = json.load(f)
                existing_uids = {c["uid"] for c in mdb.customers}
                for c in saved:
                    if c.get("uid") not in existing_uids:
                        mdb.customers.append(c)
                        existing_uids.add(c["uid"])
                print(f"[Startup] Loaded {len(saved)} registered customers from disk.")
        except Exception as e:
            print(f"[Startup] Could not load customers file: {e}")

    if not config.USE_MOCK_DB and db is not None:
        try:
            prod_ref = db.collection("products")
            docs = list(prod_ref.limit(1).stream())
            if not docs:
                print("[Firebase] Products collection empty. Seeding products...")
                for p in mdb.products:
                    prod_ref.document(p["productId"]).set(p)
                print("[Firebase] Database seeded with initial inventory.")
                
            # Seed default customers if empty
            cust_ref = db.collection("customers")
            docs_cust = list(cust_ref.limit(1).stream())
            if not docs_cust:
                for c in mdb.customers:
                    cust_ref.document(c["uid"]).set(c)
        except Exception as e:
            print(f"[Startup] Error seeding Firebase collections: {e}")
            
    # Start Firestore real-time listener (runs in background thread)
    start_firestore_listener()

# 4. API Routes

@app.get("/api/status")
def get_status():
    return {
        "status": "online",
        "mock_db": config.USE_MOCK_DB,
        "mock_ai": config.USE_MOCK_AI,
        "timestamp": time.time()
    }

# ----------------- PRODUCTS CRUD -----------------

@app.get("/api/products")
def get_products(category: Optional[str] = None, search: Optional[str] = None):
    if config.USE_MOCK_DB:
        results = mdb.products
    else:
        try:
            docs = db.collection("products").stream()
            results = [doc.to_dict() for doc in docs]
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    # Apply filters
    if category:
        results = [p for p in results if p.get("category", "").lower() == category.lower()]
    if search:
        search_lower = search.lower()
        results = [p for p in results if search_lower in p.get("name", "").lower() or search_lower in p.get("sku", "").lower()]

    return results

@app.post("/api/products")
def create_product(product: ProductModel):
    prod_id = f"prod_{uuid.uuid4().hex[:8]}"
    prod_dict = product.dict()
    prod_dict["productId"] = prod_id
    if not prod_dict.get("image"):
        prod_dict["image"] = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400"
    
    if config.USE_MOCK_DB:
        mdb.products.append(prod_dict)
        mdb.add_activity_log(f"Added product: {product.name}")
    else:
        try:
            db.collection("products").document(prod_id).set(prod_dict)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
            
    return prod_dict

@app.put("/api/products/{product_id}")
def update_product(product_id: str, product: ProductModel):
    prod_dict = product.dict()
    prod_dict["productId"] = product_id
    
    if config.USE_MOCK_DB:
        for idx, p in enumerate(mdb.products):
            if p["productId"] == product_id:
                mdb.products[idx] = prod_dict
                mdb.add_activity_log(f"Updated product: {product.name}")
                return prod_dict
        raise HTTPException(status_code=404, detail="Product not found")
    else:
        try:
            db.collection("products").document(product_id).set(prod_dict)
            return prod_dict
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/products/{product_id}")
def delete_product(product_id: str):
    if config.USE_MOCK_DB:
        for idx, p in enumerate(mdb.products):
            if p["productId"] == product_id:
                deleted = mdb.products.pop(idx)
                mdb.add_activity_log(f"Deleted product: {deleted['name']}")
                return {"status": "success", "productId": product_id}
        raise HTTPException(status_code=404, detail="Product not found")
    else:
        try:
            db.collection("products").document(product_id).delete()
            return {"status": "success", "productId": product_id}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

# ----------------- INVENTORY -----------------

@app.put("/api/inventory/{product_id}")
def adjust_stock(product_id: str, payload: StockAdjustModel):
    new_stock = payload.stock
    if config.USE_MOCK_DB:
        for p in mdb.products:
            if p["productId"] == product_id:
                prev_stock = p["stock"]
                p["stock"] = new_stock
                mdb.add_activity_log(f"Adjusted stock of {p['name']} from {prev_stock} to {new_stock}")
                if new_stock < 10:
                    mdb.add_notification("Low Stock Alert", f"{p['name']} has dropped to {new_stock} units.", "low_stock")
                return p
        raise HTTPException(status_code=404, detail="Product not found in inventory")
    else:
        try:
            ref = db.collection("products").document(product_id)
            doc = ref.get()
            if not doc.exists:
                raise HTTPException(status_code=404, detail="Product not found")
            
            p_data = doc.to_dict()
            prev_stock = p_data.get("stock", 0)
            ref.update({"stock": new_stock})
            
            # Log changes in inventory tracking
            db.collection("inventory_logs").add({
                "productId": product_id,
                "productName": p_data.get("name"),
                "previousStock": prev_stock,
                "newStock": new_stock,
                "reason": "Manual Adjustment",
                "timestamp": firestore.SERVER_TIMESTAMP
            })
            
            if new_stock < 10:
                db.collection("notifications").add({
                    "notificationId": f"notif_{uuid.uuid4().hex[:8]}",
                    "title": "Low Stock Warning",
                    "message": f"{p_data.get('name')} stock level is low ({new_stock} items remaining).",
                    "type": "low_stock",
                    "read": False,
                    "timestamp": firestore.SERVER_TIMESTAMP
                })
                
            p_data["stock"] = new_stock
            return p_data
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

# ----------------- ORDERS -----------------

@app.get("/api/orders")
def get_orders(platform: Optional[str] = None):
    if config.USE_MOCK_DB:
        results = mdb.orders
    else:
        try:
            docs = db.collection("orders").order_by("timestamp", direction=firestore.Query.DESCENDING).stream()
            results = [doc.to_dict() for doc in docs]
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
            
    if platform:
        results = [o for o in results if o.get("platform", "").lower() == platform.lower()]
    return results

@app.post("/api/orders")
def create_order(payload: OrderCreateModel):
    order_id = f"order_{uuid.uuid4().hex[:8]}"
    order_dict = payload.dict()
    
    order_dict["orderId"] = order_id
    order_dict["status"] = "Pending"
    order_dict["aiProcessed"] = False
    order_dict["aiSuggestedStatus"] = ""
    order_dict["aiSuggestions"] = []
    order_dict["subtotal"] = 0.0
    order_dict["gst"] = 0.0
    order_dict["total"] = 0.0
    order_dict["timestamp"] = time.time()
    order_dict["customerId"] = payload.customerId if hasattr(payload, 'customerId') and payload.customerId else "guest"
    
    if config.USE_MOCK_DB:
        mdb.orders.insert(0, order_dict)
        mdb.add_notification(
            "New Order Incoming", 
            f"New simulated order by {payload.customerName} via {payload.platform}.", 
            "new_order"
        )
        return order_dict
    else:
        try:
            # Save directly to firebase. The background thread listener will pick up the addition 
            # and automatically perform the AI processing and stock analysis.
            db.collection("orders").document(order_id).set(order_dict)
            return order_dict
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/orders/{order_id}/status")
def update_order_status(order_id: str, payload: OrderStatusUpdateModel):
    new_status = payload.status
    
    if config.USE_MOCK_DB:
        for idx, o in enumerate(mdb.orders):
            if o["orderId"] == order_id:
                old_status = o["status"]
                o["status"] = new_status
                
                # If order transitions to Processing/Completed, reduce inventory stock
                if new_status in ["Processing", "Completed"] and old_status not in ["Processing", "Completed"]:
                    for item in o.get("products", []):
                        name = item.get("name")
                        qty = item.get("quantity", 0)
                        for p in mdb.products:
                            if p["name"].lower() == name.lower():
                                p["stock"] = max(0, p["stock"] - qty)
                                break
                    
                    # Generate invoice record
                    inv_id = f"inv_{uuid.uuid4().hex[:8]}"
                    mdb.invoices.insert(0, {
                        "invoiceId": inv_id,
                        "orderId": order_id,
                        "customerName": o["customerName"],
                        "total": o["total"],
                        "pdfUrl": f"/api/orders/{order_id}/invoice",
                        "timestamp": time.time()
                    })
                    mdb.add_activity_log(f"Generated invoice {inv_id} for order {order_id}")
                    
                    # Automatically send invoice notification to customer
                    mdb.add_notification(
                        "Invoice Compiled Automatically",
                        f"Invoice for Order #{order_id[:8]} totaling ${o['total']:.2f} has been emailed to you and is ready to view.",
                        "invoice_sent",
                        order_id=order_id
                    )

                mdb.add_activity_log(f"Updated order status {order_id} to {new_status}")
                return o
        raise HTTPException(status_code=404, detail="Order not found")
    else:
        try:
            ref = db.collection("orders").document(order_id)
            doc = ref.get()
            if not doc.exists:
                raise HTTPException(status_code=404, detail="Order not found")
            
            o_data = doc.to_dict()
            old_status = o_data.get("status")
            ref.update({"status": new_status})
            
            # Stock reduction logic on real DB
            if new_status in ["Processing", "Completed"] and old_status not in ["Processing", "Completed"]:
                for item in o_data.get("products", []):
                    prod_name = item.get("name")
                    qty = item.get("quantity", 0)
                    
                    # Find product by name
                    prods = db.collection("products").where("name", "==", prod_name).limit(1).stream()
                    for p_doc in prods:
                        p_ref = db.collection("products").document(p_doc.id)
                        p_data = p_doc.to_dict()
                        curr_stock = p_data.get("stock", 0)
                        new_stock = max(0, curr_stock - qty)
                        p_ref.update({"stock": new_stock})
                        
                        # Log inventory transaction
                        db.collection("inventory_logs").add({
                            "productId": p_doc.id,
                            "productName": prod_name,
                            "previousStock": curr_stock,
                            "newStock": new_stock,
                            "reason": f"Order Confirmation: {order_id}",
                            "timestamp": firestore.SERVER_TIMESTAMP
                        })
                        
                        # Check low stock limit
                        if new_stock < 10:
                            db.collection("notifications").add({
                                "notificationId": f"notif_{uuid.uuid4().hex[:8]}",
                                "title": "Low Stock Warning",
                                "message": f"{prod_name} stock levels are critical ({new_stock} items remaining).",
                                "type": "low_stock",
                                "read": False,
                                "timestamp": firestore.SERVER_TIMESTAMP
                            })
                            
                # Create invoice
                inv_id = f"inv_{uuid.uuid4().hex[:8]}"
                db.collection("invoices").document(inv_id).set({
                    "invoiceId": inv_id,
                    "orderId": order_id,
                    "customerName": o_data.get("customerName"),
                    "total": o_data.get("total"),
                    "pdfUrl": f"/api/orders/{order_id}/invoice",
                    "timestamp": firestore.SERVER_TIMESTAMP
                })
                
                # Automatically send invoice notification to customer
                db.collection("notifications").add({
                    "notificationId": f"notif_{uuid.uuid4().hex[:8]}",
                    "title": "Invoice Compiled Automatically",
                    "message": f"Invoice for Order #{order_id[:8]} totaling ${o_data.get('total', 0.0):.2f} has been emailed to you and is ready to view.",
                    "type": "invoice_sent",
                    "orderId": order_id,
                    "read": False,
                    "timestamp": firestore.SERVER_TIMESTAMP
                })
                
            o_data["status"] = new_status
            return o_data
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

# ----------------- PDF INVOICES -----------------

@app.get("/api/orders/{order_id}/invoice")
def get_order_invoice(order_id: str):
    """
    Generates and downloads a custom formatted PDF invoice for a specific order.
    """
    if config.USE_MOCK_DB:
        order = None
        for o in mdb.orders:
            if o["orderId"] == order_id:
                order = o
                break
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
    else:
        try:
            doc_ref = db.collection("orders").document(order_id).get()
            if not doc_ref.exists:
                raise HTTPException(status_code=404, detail="Order not found")
            order = doc_ref.to_dict()
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    # Temporary directory for PDFs inside workspace
    temp_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "temp_invoices")
    os.makedirs(temp_dir, exist_ok=True)
    pdf_path = os.path.join(temp_dir, f"invoice_{order_id}.pdf")
    
    try:
        generate_invoice_pdf(order, pdf_path)
        return FileResponse(
            pdf_path, 
            media_type="application/pdf", 
            filename=f"invoice_{order_id[:8]}.pdf"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

# ----------------- CUSTOMERS -----------------

@app.get("/api/customers")
def get_customers():
    if config.USE_MOCK_DB:
        return mdb.customers
    else:
        try:
            docs = db.collection("customers").stream()
            return [doc.to_dict() for doc in docs]
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/customers")
def register_customer(user: RegisterUserModel):
    """
    Called by mobile app after successful sign-up to store the user
    profile in the backend database, making them visible on the web dashboard.
    """
    customer_dict = {
        "uid": user.uid,
        "name": user.name,
        "email": user.email,
        "phone": user.phone or "",
        "role": user.role or "customer",
        "address": "",
        "totalPurchases": 0.0,
        "previousOrders": 0,
        "createdAt": time.time(),
    }

    if config.USE_MOCK_DB:
        # Prevent duplicate entries by uid or email
        for existing in mdb.customers:
            if existing.get("uid") == user.uid or existing.get("email") == user.email:
                existing["name"] = user.name
                existing["phone"] = user.phone or existing.get("phone", "")
                _save_customers_to_disk()
                return existing
        mdb.customers.append(customer_dict)
        _save_customers_to_disk()
        mdb.add_activity_log(f"New customer registered: {user.name} ({user.email})")
        return customer_dict
    else:
        try:
            ref = db.collection("customers").document(user.uid)
            doc = ref.get()
            if doc.exists:
                ref.update({"name": user.name, "phone": user.phone or ""})
                return {**doc.to_dict(), "name": user.name, "phone": user.phone or ""}
            ref.set(customer_dict)
            return customer_dict
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


def _save_customers_to_disk():
    """Persist the current customers list to a JSON file so registrations
    survive backend restarts (mock mode only)."""
    try:
        os.makedirs(os.path.dirname(CUSTOMERS_FILE), exist_ok=True)
        # Exclude the hardcoded seed customer from the saved file to avoid duplicates on reload
        to_save = [c for c in mdb.customers if c.get("uid") != "cust_1"]
        with open(CUSTOMERS_FILE, "w", encoding="utf-8") as f:
            json.dump(to_save, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"[Persistence] Failed to save customers: {e}")

# ----------------- AI ASSISTANT CHAT -----------------

@app.post("/api/ai/chat")
def run_ai_chat(payload: ChatQuestionModel):
    """
    Processes a chat query from the business owner.
    Provides answers dynamically using the current store products and orders.
    """
    if config.USE_MOCK_DB:
        inventory_data = mdb.products
        sales_data = mdb.orders
    else:
        try:
            prod_docs = db.collection("products").stream()
            inventory_data = [d.to_dict() for d in prod_docs]
            
            order_docs = db.collection("orders").stream()
            sales_data = [d.to_dict() for d in order_docs]
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Context collection query failed: {str(e)}")
            
    answer = get_business_answer(payload.question, inventory_data, sales_data)
    return {"response": answer}

# ----------------- NOTIFICATIONS -----------------

@app.get("/api/notifications")
def get_notifications():
    if config.USE_MOCK_DB:
        return mdb.notifications
    else:
        try:
            docs = db.collection("notifications").order_by("timestamp", direction=firestore.Query.DESCENDING).limit(10).stream()
            return [doc.to_dict() for doc in docs]
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/notifications/read")
def mark_all_notifications_read():
    if config.USE_MOCK_DB:
        for n in mdb.notifications:
            n["read"] = True
        return {"status": "success"}
    else:
        try:
            docs = db.collection("notifications").where("read", "==", False).stream()
            batch = db.batch()
            for doc in docs:
                batch.update(db.collection("notifications").document(doc.id), {"read": True})
            batch.commit()
            return {"status": "success"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

# ----------------- REPORTS & ANALYTICS -----------------

@app.get("/api/reports")
def get_reports_summary():
    if config.USE_MOCK_DB:
        prods = mdb.products
        ords = mdb.orders
    else:
        try:
            prods = [doc.to_dict() for doc in db.collection("products").stream()]
            ords = [doc.to_dict() for doc in db.collection("orders").stream()]
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    # Compile analytics reports
    revenue = sum(o.get("total", 0.0) for o in ords if o.get("status") in ["Completed", "Processing"])
    pending = len([o for o in ords if o.get("status") == "Pending"])
    completed = len([o for o in ords if o.get("status") == "Completed"])
    total_products = len(prods)
    low_stock = len([p for p in prods if p.get("stock", 0) < 10])
    
    # Calculate daily order volume (platform distribution)
    platforms = {}
    for o in ords:
        plat = o.get("platform", "direct").lower()
        platforms[plat] = platforms.get(plat, 0) + 1
        
    return {
        "metrics": {
            "totalRevenue": round(revenue, 2),
            "pendingOrders": pending,
            "completedOrders": completed,
            "totalProducts": total_products,
            "lowStockItems": low_stock
        },
        "platforms": platforms
    }

@app.get("/api/reports/export")
def export_reports_csv():
    """
    Generates and returns a downloadable CSV sales ledger.
    """
    if config.USE_MOCK_DB:
        ords = mdb.orders
    else:
        try:
            docs = db.collection("orders").stream()
            ords = [doc.to_dict() for doc in docs]
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    # Create memory string buffer for CSV
    f = StringIO()
    writer = csv.writer(f)
    
    # Header
    writer.writerow(["Order ID", "Customer Name", "Platform", "Date", "Items", "Subtotal", "GST", "Total", "Status"])
    
    for o in ords:
        timestamp = o.get("timestamp")
        date_str = ""
        if isinstance(timestamp, (int, float)):
            date_str = datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d")
        elif isinstance(timestamp, dict) and "_seconds" in timestamp:
            date_str = datetime.fromtimestamp(timestamp["_seconds"]).strftime("%Y-%m-%d")
        else:
            date_str = str(timestamp)[:10]
            
        items_str = "; ".join([f"{i.get('name')} x{i.get('quantity')}" for i in o.get("products", [])])
        
        writer.writerow([
            o.get("orderId"),
            o.get("customerName"),
            o.get("platform", "direct").upper(),
            date_str,
            items_str,
            o.get("subtotal"),
            o.get("gst"),
            o.get("total"),
            o.get("status")
        ])
        
    f.seek(0)
    response = StreamingResponse(f, media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=sales_report.csv"
    return response

# ----------------- SYSTEM ACTIVITY LOGS -----------------
@app.get("/api/logs")
def get_activity_logs():
    if config.USE_MOCK_DB:
        return mdb.activity_logs
    else:
        try:
            # Query standard activity logs from firestore if they exist
            docs = db.collection("activity_logs").order_by("timestamp", direction=firestore.Query.DESCENDING).limit(20).stream()
            return [doc.to_dict() for doc in docs]
        except Exception:
            # Fallback to local logs
            return mdb.activity_logs

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=config.PORT, reload=True)
