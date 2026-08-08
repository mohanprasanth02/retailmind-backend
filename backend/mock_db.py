import time
import uuid
from datetime import datetime

# In-Memory Database for Mock Mode
products = [
    {"productId": "prod_1", "name": "Nike Air Max", "category": "Shoes", "price": 120.00, "stock": 45, "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400", "sku": "NK-AM-01", "supplier": "Nike Inc."},
    {"productId": "prod_2", "name": "Adidas Ultraboost", "category": "Shoes", "price": 180.00, "stock": 8, "image": "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400", "sku": "AD-UB-02", "supplier": "Adidas Group"},
    {"productId": "prod_3", "name": "Classic Black T-Shirt", "category": "Apparel", "price": 25.00, "stock": 120, "image": "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400", "sku": "AP-TS-03", "supplier": "Apparel Corp"},
    {"productId": "prod_4", "name": "Premium Gray Hoodie", "category": "Apparel", "price": 55.00, "stock": 5, "image": "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400", "sku": "AP-HD-04", "supplier": "Apparel Corp"},
    {"productId": "prod_5", "name": "Denim Slim Fit Jeans", "category": "Apparel", "price": 65.00, "stock": 40, "image": "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400", "sku": "AP-JN-05", "supplier": "Denim Co"},
    {"productId": "prod_6", "name": "Smart Fitness Watch", "category": "Electronics", "price": 150.00, "stock": 15, "image": "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=400", "sku": "EL-SW-06", "supplier": "ElectroTech"},
    {"productId": "prod_7", "name": "Stainless Water Bottle", "category": "Accessories", "price": 30.00, "stock": 60, "image": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400", "sku": "AC-WB-07", "supplier": "EcoGoods"},
    {"productId": "prod_8", "name": "Vans Old Skool", "category": "Shoes", "price": 60.00, "stock": 40, "image": "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=400", "sku": "SH-VO-08", "supplier": "Vans Inc."},
    {"productId": "prod_9", "name": "Converse Chuck Taylor", "category": "Shoes", "price": 55.00, "stock": 60, "image": "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400", "sku": "SH-CC-09", "supplier": "Converse"},
    {"productId": "prod_10", "name": "Chelsea Leather Boots", "category": "Shoes", "price": 140.00, "stock": 15, "image": "https://images.unsplash.com/photo-1638247025967-b4e38f68917a?w=400", "sku": "SH-CB-10", "supplier": "Timberland"},
    {"productId": "prod_11", "name": "New Balance 574", "category": "Shoes", "price": 90.00, "stock": 25, "image": "https://images.unsplash.com/photo-1539185441755-769473a23570?w=400", "sku": "SH-NB-11", "supplier": "New Balance Corp"},
    {"productId": "prod_12", "name": "Air Jordan 1 Retro", "category": "Shoes", "price": 170.00, "stock": 12, "image": "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=400", "sku": "SH-AJ-12", "supplier": "Nike Inc."},
    {"productId": "prod_13", "name": "Leather Dress Shoes", "category": "Shoes", "price": 110.00, "stock": 20, "image": "https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=400", "sku": "SH-LS-13", "supplier": "Cole Haan"},
    {"productId": "prod_14", "name": "Puma Suede Classic", "category": "Shoes", "price": 65.00, "stock": 35, "image": "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400", "sku": "SH-PS-14", "supplier": "Puma Group"},
    {"productId": "prod_15", "name": "Timberland Waterproof Boots", "category": "Shoes", "price": 190.00, "stock": 18, "image": "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=400", "sku": "SH-TB-15", "supplier": "Timberland"},
    {"productId": "prod_16", "name": "Cotton Polo Shirt", "category": "Apparel", "price": 35.00, "stock": 80, "image": "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=400", "sku": "AP-PS-16", "supplier": "Apparel Corp"},
    {"productId": "prod_17", "name": "Women's Denim Jacket", "category": "Apparel", "price": 75.00, "stock": 25, "image": "https://images.unsplash.com/photo-1611312449412-6cefac5dc3e4?w=400", "sku": "AP-DJ-17", "supplier": "Denim Co"},
    {"productId": "prod_18", "name": "Warm Woolen Beanie", "category": "Apparel", "price": 18.00, "stock": 95, "image": "https://images.unsplash.com/photo-1576871337622-98d48d4aa53e?w=400", "sku": "AP-WB-18", "supplier": "WarmWear"},
    {"productId": "prod_19", "name": "Sports Windbreaker", "category": "Apparel", "price": 60.00, "stock": 30, "image": "https://images.unsplash.com/photo-1548883354-7622d03aca27?w=400", "sku": "AP-SW-19", "supplier": "Denim Co"},
    {"productId": "prod_20", "name": "Summer Floral Dress", "category": "Apparel", "price": 45.00, "stock": 40, "image": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400", "sku": "AP-FD-20", "supplier": "Apparel Corp"},
    {"productId": "prod_21", "name": "Cargo Shorts", "category": "Apparel", "price": 30.00, "stock": 50, "image": "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=400", "sku": "AP-CS-21", "supplier": "Denim Co"},
    {"productId": "prod_22", "name": "Athletic Sweatpants", "category": "Apparel", "price": 40.00, "stock": 65, "image": "https://images.unsplash.com/photo-1551854838-212c50b4c184?w=400", "sku": "AP-SP-22", "supplier": "LuluFlex"},
    {"productId": "prod_23", "name": "Wireless Ergonomic Mouse", "category": "Electronics", "price": 49.99, "stock": 45, "image": "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=400", "sku": "EL-WM-23", "supplier": "ElectroTech"},
    {"productId": "prod_24", "name": "Bluetooth ANC Headphones", "category": "Electronics", "price": 199.99, "stock": 20, "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400", "sku": "EL-HP-24", "supplier": "SonicBoom"},
    {"productId": "prod_25", "name": "USB-C Multiport Adapter", "category": "Electronics", "price": 39.99, "stock": 70, "image": "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=400", "sku": "EL-UA-25", "supplier": "ElectroTech"},
    {"productId": "prod_26", "name": "HD Webcam 1080p", "category": "Electronics", "price": 59.99, "stock": 35, "image": "https://images.unsplash.com/photo-1600541519468-4a18d22f87a3?w=400", "sku": "EL-WC-26", "supplier": "PixelTech"},
    {"productId": "prod_27", "name": "Smart LED Desk Lamp", "category": "Electronics", "price": 29.99, "stock": 55, "image": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400", "sku": "EL-DL-27", "supplier": "ElectroTech"},
    {"productId": "prod_28", "name": "Power Bank 20000mAh", "category": "Electronics", "price": 34.99, "stock": 90, "image": "https://images.unsplash.com/photo-1609592424085-fe4d1e2e13fa?w=400", "sku": "EL-PB-28", "supplier": "SonicBoom"},
    {"productId": "prod_29", "name": "Dual-Band Wi-Fi Router", "category": "Electronics", "price": 79.99, "stock": 15, "image": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400", "sku": "EL-WR-29", "supplier": "ElectroTech"},
    {"productId": "prod_30", "name": "RGB Mechanical Keyboard", "category": "Electronics", "price": 89.99, "stock": 25, "image": "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=400", "sku": "EL-MK-30", "supplier": "KeyForge"},
    {"productId": "prod_31", "name": "Leather Passport Holder", "category": "Accessories", "price": 20.00, "stock": 100, "image": "https://images.unsplash.com/photo-1544816155-12df9643f363?w=400", "sku": "AC-PH-31", "supplier": "Hide & Suede"},
    {"productId": "prod_32", "name": "Polarized Aviator Sunglasses", "category": "Accessories", "price": 50.00, "stock": 45, "image": "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400", "sku": "AC-AS-32", "supplier": "Apex Optics"},
    {"productId": "prod_33", "name": "Canvas Travel Backpack", "category": "Accessories", "price": 70.00, "stock": 30, "image": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400", "sku": "AC-TB-33", "supplier": "Sleek Designs"},
    {"productId": "prod_34", "name": "Stainless Steel Key Organizer", "category": "Accessories", "price": 15.00, "stock": 150, "image": "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=400", "sku": "AC-KO-34", "supplier": "EcoGoods"},
    {"productId": "prod_35", "name": "Wool Knit Scarf", "category": "Accessories", "price": 25.00, "stock": 80, "image": "https://images.unsplash.com/photo-1520903928273-0f44b0a2fe9a?w=400", "sku": "AC-KS-35", "supplier": "WarmWear"},
    {"productId": "prod_36", "name": "Silicone Smart Watch Band", "category": "Accessories", "price": 12.99, "stock": 200, "image": "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=400", "sku": "AC-WB-36", "supplier": "EcoGoods"},
    {"productId": "prod_37", "name": "Reusable Tote Bag", "category": "Accessories", "price": 8.50, "stock": 300, "image": "https://images.unsplash.com/photo-1544816155-12df9643f363?w=400", "sku": "AC-RT-37", "supplier": "EcoGoods"}
]

# We will initialize inventories to mirror products
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
    {"uid": "cust_1", "email": "john@example.com", "name": "John Doe", "role": "customer", "createdAt": time.time()}
]

customers = [
    {"uid": "cust_1", "name": "John Doe", "phone": "+1 (555) 123-4567", "email": "john@example.com", "address": "123 Main St, New York, NY", "totalPurchases": 240.00, "previousOrders": 2}
]

orders = []

notifications = []

invoices = []

# Track system logs
activity_logs = [
    {"logId": "log_init", "message": "System database initialized.", "timestamp": time.time(), "userId": "system"}
]

# Core helpers to manipulate local database

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
    # cap at 30
    if len(notifications) > 30:
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
    return log
