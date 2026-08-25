import time
import threading
import uuid
from config import USE_MOCK_DB
from services.ai_service import extract_order_details

# Import Firebase Admin if not in mock mode
if not USE_MOCK_DB:
    try:
        from firebase_admin import firestore
    except ImportError:
        pass

def start_firestore_listener():
    """
    Spawns a background thread to listen for new orders and process them with AI.
    """
    if USE_MOCK_DB:
        print("[Listener] Starting Mock Database Order processing thread...")
        thread = threading.Thread(target=_mock_listener_loop, daemon=True)
        thread.start()
        return thread
    else:
        print("[Listener] Starting real Firebase Firestore Snapshot Listener...")
        thread = threading.Thread(target=_firebase_listener_setup, daemon=True)
        thread.start()
        return thread

def _process_order_ai(order_data: dict, db_ref=None):
    """
    Processes a single order with AI:
    - Extracts items
    - Matches with active inventory
    - Calculates pricing & GST
    - Checks stock availability
    - Generates restock alerts / alternative recommendations
    """
    order_id = order_data.get("orderId")
    message = order_data.get("message", "")
    customer_name = order_data.get("customerName", "Valued Customer")
    platform = order_data.get("platform", "direct")
    
    print(f"[Listener] AI Processing Order {order_id} from {customer_name} ({platform})...")

    # If products are already present and message is empty, we don't need AI extraction
    extracted = {"products": []}
    if message.strip():
        extracted = extract_order_details(message)
    else:
        # Fallback to existing products if form-ordered
        extracted["products"] = [
            {"name": p.get("name"), "quantity": p.get("quantity", 1)} 
            for p in order_data.get("products", [])
        ]
        extracted["customer_name"] = customer_name
        extracted["phone"] = order_data.get("phone", "")
        extracted["address"] = order_data.get("address", "")
        extracted["delivery_request"] = "Standard order form."

    # Fetch active products/inventory to check stock & match exact names
    matched_products = []
    has_stock_issue = False
    ai_suggestions = []
    
    subtotal = 0.0

    if USE_MOCK_DB:
        import mock_db as mdb
        available_products = mdb.products
    else:
        # Fetch from real firestore
        try:
            prod_docs = db_ref.collection("products").stream()
            available_products = [doc.to_dict() for doc in prod_docs]
        except Exception as e:
            print(f"[Listener] Error fetching products: {e}")
            available_products = []

    # Map name lower to product
    product_map = {p["name"].lower(): p for p in available_products}
    
    # Analyze items
    for item in extracted.get("products", []):
        item_name = item.get("name", "")
        qty = item.get("quantity", 1)
        
        # Try finding a fuzzy or direct match
        matched_prod = None
        item_name_lower = item_name.lower()
        
        # Exact match check
        if item_name_lower in product_map:
            matched_prod = product_map[item_name_lower]
        else:
            # Fuzzy match check
            for key, prod in product_map.items():
                if key in item_name_lower or item_name_lower in key:
                    matched_prod = prod
                    break
        
        if matched_prod:
            price = matched_prod.get("price", 0.0)
            stock = matched_prod.get("stock", 0)
            p_name = matched_prod.get("name")
            p_id = matched_prod.get("productId")
            
            subtotal += price * qty
            
            # Stock availability check
            if stock < qty:
                has_stock_issue = True
                # Find alternative product in same category that has stock
                category = matched_prod.get("category", "")
                alternative = None
                for p in available_products:
                    if p.get("category") == category and p.get("stock", 0) >= qty and p.get("productId") != p_id:
                        alternative = p
                        break
                
                if alternative:
                    ai_suggestions.append(f"Replace out-of-stock '{p_name}' (Stock: {stock}) with '{alternative['name']}' (Stock: {alternative['stock']})")
                else:
                    ai_suggestions.append(f"No suitable alternative in category '{category}' for '{p_name}'. Stock is empty.")
            
            matched_products.append({
                "productId": p_id,
                "name": p_name,
                "quantity": qty,
                "price": price
            })
        else:
            # Item not found in inventory
            has_stock_issue = True
            ai_suggestions.append(f"Product '{item_name}' was not found in store database.")
            matched_products.append({
                "productId": "unknown",
                "name": item_name,
                "quantity": qty,
                "price": 0.0
            })

    # Calculations
    gst = subtotal * 0.18
    total = subtotal + gst
    
    # Update properties
    order_data["products"] = matched_products
    order_data["subtotal"] = round(subtotal, 2)
    order_data["gst"] = round(gst, 2)
    order_data["total"] = round(total, 2)
    order_data["aiProcessed"] = True
    order_data["aiSuggestedStatus"] = "Stock Unavailable" if has_stock_issue else "Approved"
    order_data["aiSuggestions"] = ai_suggestions
    
    # Sync phone/address/name if AI parsed them and they were empty
    if not order_data.get("phone") and extracted.get("phone"):
        order_data["phone"] = extracted["phone"]
    if not order_data.get("address") and extracted.get("address"):
        order_data["address"] = extracted["address"]
    if order_data.get("customerName") == "Valued Customer" and extracted.get("customer_name"):
        order_data["customerName"] = extracted["customer_name"]

    print(f"[Listener] Completed AI Processing for Order {order_id}. AI Suggested Status: {order_data['aiSuggestedStatus']}")
    
    # Return processed object
    return order_data

def _mock_listener_loop():
    """
    In-memory polling loop for orders that need AI processing.
    """
    import mock_db as mdb
    while True:
        try:
            # Look for unprocessed orders
            unprocessed = [o for o in mdb.orders if not o.get("aiProcessed", False)]
            for order in unprocessed:
                processed_order = _process_order_ai(order)
                # Update in list
                for i, o in enumerate(mdb.orders):
                    if o["orderId"] == processed_order["orderId"]:
                        mdb.orders[i] = processed_order
                        break
                mdb.save_orders()
                
                # Push notifications
                mdb.add_notification(
                    "Order Processed (AI)",
                    f"New order by {processed_order['customerName']} from {processed_order['platform']} was analyzed by AI.",
                    "new_order"
                )
                
                # Low stock alerts for suggestions
                if processed_order["aiSuggestedStatus"] == "Stock Unavailable":
                    mdb.add_notification(
                        "Stock Unavailable Alert",
                        f"Order {processed_order['orderId'][:8]} has items that are out of stock. AI generated alternatives.",
                        "low_stock"
                    )
                    
        except Exception as e:
            print(f"[Listener Thread] Mock loop error: {e}")
            
        time.sleep(3) # check every 3 seconds

def _firebase_listener_setup():
    """
    Listens directly to Firestore additions using the client SDK.
    """
    try:
        db = firestore.client()
    except Exception as e:
        print(f"[Listener Thread] Failed to retrieve Firestore client: {e}. Falling back to mock thread.")
        _mock_listener_loop()
        return

    orders_ref = db.collection("orders")
    
    def on_snapshot(col_snapshot, changes, read_time):
        for change in changes:
            # We listen for ADDED documents that are not processed
            if change.type.name == 'ADDED' or change.type.name == 'MODIFIED':
                order_doc = change.document
                order_dict = order_doc.to_dict()
                
                if not order_dict.get("aiProcessed", False):
                    # Process with AI
                    processed_dict = _process_order_ai(order_dict, db_ref=db)
                    # Write back to firestore
                    try:
                        orders_ref.document(order_doc.id).update(processed_dict)
                        # Add a notification document in Firestore
                        db.collection("notifications").add({
                            "notificationId": f"notif_{uuid.uuid4().hex[:8]}",
                            "title": "Order Processed (AI)",
                            "message": f"New order by {processed_dict['customerName']} from {processed_dict['platform']} was analyzed by AI.",
                            "type": "new_order",
                            "read": False,
                            "timestamp": firestore.SERVER_TIMESTAMP
                        })
                        
                        if processed_dict["aiSuggestedStatus"] == "Stock Unavailable":
                            db.collection("notifications").add({
                                "notificationId": f"notif_{uuid.uuid4().hex[:8]}",
                                "title": "Stock Unavailable Alert",
                                "message": f"Order {processed_dict['orderId'][:8]} has items out of stock. AI suggested alternatives.",
                                "type": "low_stock",
                                "read": False,
                                "timestamp": firestore.SERVER_TIMESTAMP
                            })
                    except Exception as err:
                        print(f"[Listener Thread] Firestore writeback failed: {err}")

    # Watch the collection
    orders_ref.on_snapshot(on_snapshot)
    
    # Keep the listener thread alive
    while True:
        time.sleep(10)
