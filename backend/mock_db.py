import os
import json
import time
import uuid
from datetime import datetime

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
os.makedirs(DATA_DIR, exist_ok=True)

ORDERS_FILE = os.path.join(DATA_DIR, "orders.json")
INVOICES_FILE = os.path.join(DATA_DIR, "invoices.json")
CUSTOMERS_FILE = os.path.join(DATA_DIR, "registered_customers.json")

# In-Memory Database for Mock Mode
products = [
    {"productId": "prod_1", "name": "Nike Air Max", "category": "Shoes", "price": 9960.00, "stock": 45, "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400", "sku": "NK-AM-01", "supplier": "Nike Inc."},
    {"productId": "prod_2", "name": "Adidas Ultraboost", "category": "Shoes", "price": 14940.00, "stock": 8, "image": "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400", "sku": "AD-UB-02", "supplier": "Adidas Group"},
    {"productId": "prod_3", "name": "Classic Black T-Shirt", "category": "Apparel", "price": 2075.00, "stock": 120, "image": "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400", "sku": "AP-TS-03", "supplier": "Apparel Corp"},
    {"productId": "prod_4", "name": "Premium Gray Hoodie", "category": "Apparel", "price": 4565.00, "stock": 5, "image": "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400", "sku": "AP-HD-04", "supplier": "Apparel Corp"},
    {"productId": "prod_5", "name": "Denim Slim Fit Jeans", "category": "Apparel", "price": 5395.00, "stock": 40, "image": "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400", "sku": "AP-JN-05", "supplier": "Denim Co"},
    {"productId": "prod_6", "name": "Smart Fitness Watch", "category": "Electronics", "price": 12450.00, "stock": 15, "image": "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=400", "sku": "EL-SW-06", "supplier": "ElectroTech"},
    {"productId": "prod_7", "name": "Stainless Water Bottle", "category": "Accessories", "price": 2490.00, "stock": 60, "image": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400", "sku": "AC-WB-07", "supplier": "EcoGoods"},
    {"productId": "prod_8", "name": "Vans Old Skool", "category": "Shoes", "price": 4980.00, "stock": 40, "image": "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=400", "sku": "SH-VO-08", "supplier": "Vans Inc."},
    {"productId": "prod_9", "name": "Converse Chuck Taylor", "category": "Shoes", "price": 4565.00, "stock": 60, "image": "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400", "sku": "SH-CC-09", "supplier": "Converse"},
    {"productId": "prod_10", "name": "Chelsea Leather Boots", "category": "Shoes", "price": 11620.00, "stock": 15, "image": "https://images.unsplash.com/photo-1638247025967-b4e38f68917a?w=400", "sku": "SH-CB-10", "supplier": "Timberland"},
    {"productId": "prod_11", "name": "New Balance 574", "category": "Shoes", "price": 7470.00, "stock": 25, "image": "https://images.unsplash.com/photo-1539185441755-769473a23570?w=400", "sku": "SH-NB-11", "supplier": "New Balance Corp"},
    {"productId": "prod_12", "name": "Air Jordan 1 Retro", "category": "Shoes", "price": 14110.00, "stock": 12, "image": "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=400", "sku": "SH-AJ-12", "supplier": "Nike Inc."},
    {"productId": "prod_13", "name": "Leather Dress Shoes", "category": "Shoes", "price": 9130.00, "stock": 20, "image": "https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=400", "sku": "SH-LS-13", "supplier": "Cole Haan"},
    {"productId": "prod_14", "name": "Puma Suede Classic", "category": "Shoes", "price": 5395.00, "stock": 35, "image": "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400", "sku": "SH-PS-14", "supplier": "Puma Group"},
    {"productId": "prod_15", "name": "Timberland Waterproof Boots", "category": "Shoes", "price": 15770.00, "stock": 18, "image": "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=400", "sku": "SH-TB-15", "supplier": "Timberland"},
    {"productId": "prod_16", "name": "Cotton Polo Shirt", "category": "Apparel", "price": 2905.00, "stock": 80, "image": "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=400", "sku": "AP-PS-16", "supplier": "Apparel Corp"},
    {"productId": "prod_17", "name": "Women's Denim Jacket", "category": "Apparel", "price": 6225.00, "stock": 25, "image": "https://images.unsplash.com/photo-1611312449412-6cefac5dc3e4?w=400", "sku": "AP-DJ-17", "supplier": "Denim Co"},
    {"productId": "prod_18", "name": "Warm Woolen Beanie", "category": "Apparel", "price": 1494.00, "stock": 95, "image": "https://images.unsplash.com/photo-1576871337622-98d48d4aa53e?w=400", "sku": "AP-WB-18", "supplier": "WarmWear"},
    {"productId": "prod_19", "name": "Sports Windbreaker", "category": "Apparel", "price": 4980.00, "stock": 30, "image": "https://images.unsplash.com/photo-1548883354-7622d03aca27?w=400", "sku": "AP-SW-19", "supplier": "Denim Co"},
    {"productId": "prod_20", "name": "Summer Floral Dress", "category": "Apparel", "price": 3735.00, "stock": 40, "image": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400", "sku": "AP-FD-20", "supplier": "Apparel Corp"},
    {"productId": "prod_21", "name": "Cargo Shorts", "category": "Apparel", "price": 2490.00, "stock": 50, "image": "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=400", "sku": "AP-CS-21", "supplier": "Denim Co"},
    {"productId": "prod_22", "name": "Athletic Sweatpants", "category": "Apparel", "price": 3320.00, "stock": 65, "image": "https://images.unsplash.com/photo-1551854838-212c50b4c184?w=400", "sku": "AP-SP-22", "supplier": "LuluFlex"},
    {"productId": "prod_23", "name": "Classic Aviator Sunglasses", "category": "Accessories", "price": 4150.00, "stock": 30, "image": "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400", "sku": "AC-AS-23", "supplier": "RayOptics"},
    {"productId": "prod_24", "name": "Leather Bifold Wallet", "category": "Accessories", "price": 2490.00, "stock": 45, "image": "https://images.unsplash.com/photo-1627123424574-724758594e93?w=400", "sku": "AC-LW-24", "supplier": "LeatherCraft"}
]

inventory = []
for p in products:
    inventory.append({
        "productId": p["productId"],
        "Product": p["name"],
        "SKU": p["sku"],
        "Category": p["category"],
        "Price": p["price"],
        "Stock": p["stock"],
        "Image": p["image"],
        "Supplier": p["supplier"]
    })

users = [
    {"uid": "admin_1", "email": "admin@retailmind.ai", "name": "Admin Manager", "role": "admin", "createdAt": time.time()},
]

# Helper to load JSON safely
def _load_json_list(filepath):
    try:
        if os.path.exists(filepath):
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list):
                    return data
    except Exception as e:
        print(f"[mock_db] Failed to load {filepath}: {e}")
    return []

# Helper to save JSON safely
def _save_json_list(filepath, data):
    try:
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"[mock_db] Failed to save {filepath}: {e}")

# Load persistent customers
customers = _load_json_list(CUSTOMERS_FILE)

# Load persistent orders (survives restarts)
orders = _load_json_list(ORDERS_FILE)

# Load persistent invoices (survives restarts)
invoices = _load_json_list(INVOICES_FILE)

notifications = []

activity_logs = [
    {"logId": "log_init", "message": "System database initialized.", "timestamp": time.time(), "userId": "system"}
]

def save_orders():
    _save_json_list(ORDERS_FILE, orders)

def save_invoices():
    _save_json_list(INVOICES_FILE, invoices)

def save_customers():
    _save_json_list(CUSTOMERS_FILE, customers)

def add_notification(title, message, notif_type, order_id=None):
    notif = {
        "notificationId": f"notif_{uuid.uuid4().hex[:8]}",
        "title": title,
        "message": message,
        "type": notif_type,
        "read": False,
        "timestamp": time.time()
    }
    if order_id:
        notif["orderId"] = order_id
    notifications.insert(0, notif)
    if len(notifications) > 50:
        notifications.pop()
    return notif

def add_activity_log(message, user_id="admin_1"):
    log = {
        "logId": f"log_{uuid.uuid4().hex[:8]}",
        "message": message,
        "timestamp": time.time(),
        "userId": user_id
    }
    activity_logs.insert(0, log)
    if len(activity_logs) > 100:
        activity_logs.pop()
    return log
