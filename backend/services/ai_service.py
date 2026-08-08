import json
import re
from openai import OpenAI
from config import USE_MOCK_AI, OPENAI_API_KEY

client = None
if not USE_MOCK_AI and OPENAI_API_KEY:
    client = OpenAI(api_key=OPENAI_API_KEY)

def extract_order_details(message: str) -> dict:
    """
    Extracts products, quantities, customer name, phone, address, and requests from a raw message.
    Returns a dictionary matching the schema.
    """
    default_response = {
        "products": [],
        "customer_name": "",
        "phone": "",
        "address": "",
        "delivery_request": ""
    }

    if USE_MOCK_AI or client is None:
        # Intelligent Rule-Based Local Fallback Parser
        print("[AI Service] Using local parser fallback...")
        products = []
        
        # Simple heuristics for products
        # Looks for patterns like "2 Nike Shoes", "3 Black T-Shirts", "1 Laptop"
        # Also handles "Nike Shoes: 2", etc.
        patterns = [
            r'(\d+)\s+([a-zA-Z\s\-]+)',  # e.g., "2 Nike Shoes"
            r'([a-zA-Z\s\-]+)\s*:\s*(\d+)' # e.g., "Nike Shoes: 2"
        ]
        
        lines = message.split('\n')
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            matched = False
            for pattern in patterns:
                matches = re.findall(pattern, line)
                if matches:
                    for m in matches:
                        # Depending on regex, quantity might be first or second
                        if m[0].isdigit():
                            qty = int(m[0])
                            name = m[1].strip()
                        else:
                            qty = int(m[1])
                            name = m[0].strip()
                        
                        # Filter out common false positives (like tomorrow, deliver, address)
                        name_lower = name.lower()
                        if name_lower in ["deliver", "deliver tomorrow", "tomorrow", "hi", "hello", "need", "address", "phone"]:
                            continue
                            
                        # Standardize common names for demo
                        if "nike" in name_lower:
                            name = "Nike Air Max"
                        elif "shirt" in name_lower or "t-shirt" in name_lower:
                            name = "Classic Black T-Shirt"
                        elif "hoodie" in name_lower:
                            name = "Premium Gray Hoodie"
                        elif "jeans" in name_lower:
                            name = "Denim Slim Fit Jeans"
                        elif "watch" in name_lower:
                            name = "Smart Fitness Watch"
                        elif "bottle" in name_lower:
                            name = "Stainless Water Bottle"
                            
                        products.append({"name": name, "quantity": qty})
                    matched = True
                    break
            
            # Simple extraction for phone, name, address
            phone_match = re.search(r'(\+?\d[\d\-\s]{8,}\d)', message)
            if phone_match:
                default_response["phone"] = phone_match.group(1).strip()
                
            address_match = re.search(r'(?:deliver to|address|delivery address)[:\s]+([a-zA-Z0-9\s,\.\-]+)', message, re.IGNORECASE)
            if address_match:
                default_response["address"] = address_match.group(1).strip()
                
            name_match = re.search(r'(?:my name is|i am|customer|name)[:\s]+([a-zA-Z\s]+)', message, re.IGNORECASE)
            if name_match:
                default_response["customer_name"] = name_match.group(1).strip()

        # Deduplicate list
        unique_products = []
        seen = set()
        for p in products:
            if p["name"] not in seen:
                seen.add(p["name"])
                unique_products.append(p)
                
        # If no products were found, make a default fallback product for demo
        if not unique_products:
            unique_products.append({"name": "Nike Air Max", "quantity": 1})
            
        default_response["products"] = unique_products
        
        # Parse delivery dates/requests
        if "tomorrow" in message.lower():
            default_response["delivery_request"] = "Deliver tomorrow."
        else:
            default_response["delivery_request"] = "Standard delivery requested."
            
        return default_response

    # Real OpenAI API usage
    try:
        system_prompt = (
            "You are a structured retail ordering assistant. Analyze the incoming message and extract details.\n"
            "Respond ONLY with a valid JSON object matching this schema:\n"
            "{\n"
            "  \"products\": [\n"
            "    { \"name\": \"Product Name\", \"quantity\": 2 }\n"
            "  ],\n"
            "  \"customer_name\": \"Extracted Name (or empty string)\",\n"
            "  \"phone\": \"Extracted Phone (or empty string)\",\n"
            "  \"address\": \"Extracted Address (or empty string)\",\n"
            "  \"delivery_request\": \"Extracted Delivery Instructions (or empty string)\"\n"
            "}\n"
            "Standardize product names to common retail items (e.g., 'Nike Shoes' -> 'Nike Air Max', 'Black T-Shirt' -> 'Classic Black T-Shirt', 'Premium Gray Hoodie', 'Denim Slim Fit Jeans', 'Smart Fitness Watch')."
        )
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ],
            temperature=0.0
        )
        
        extracted = json.loads(response.choices[0].message.content)
        return extracted
    except Exception as e:
        print(f"[AI Service] OpenAI error during order extraction: {e}")
        # Return empty shell
        return default_response

def get_business_answer(question: str, inventory_data: list, sales_data: list) -> str:
    """
    Answers business intelligence questions based on current inventory and sales data context.
    """
    if USE_MOCK_AI or client is None:
        print("[AI Service] Business Chat: Using local heuristics fallback...")
        q = question.lower()
        
        # Calculate some summary stats to use in mock answers
        total_revenue = sum(sale.get("total", 0.0) for sale in sales_data)
        total_orders = len(sales_data)
        low_stock_items = [p.get("name", "Unknown") for p in inventory_data if int(p.get("stock", 0)) < 10]
        
        # Product sales counts
        product_sales = {}
        for sale in sales_data:
            for item in sale.get("products", []):
                name = item.get("name")
                qty = item.get("quantity", 0)
                product_sales[name] = product_sales.get(name, 0) + qty
                
        top_product = "None"
        if product_sales:
            top_product = max(product_sales, key=product_sales.get)

        if "revenue" in q or "sales" in q or "sold" in q and ("how much" in q or "total" in q):
            return f"The total revenue accumulated is **${total_revenue:,.2f}** from **{total_orders} orders** recorded in the system."
            
        if "restock" in q or "low stock" in q or "replenish" in q:
            if low_stock_items:
                items_str = ", ".join(low_stock_items[:5])
                return f"The following products need restocking (stock < 10 items): **{items_str}**. Consider placing supplier orders."
            else:
                return "All items are currently well stocked. No immediate restocks required!"
                
        if "highest" in q or "top" in q or "best" in q:
            if top_product != "None":
                count = product_sales[top_product]
                return f"The highest selling product is **{top_product}** with **{count} units** sold."
            else:
                return "Not enough sales data yet to calculate the highest-selling products."
                
        if "how many" in q and "shoes" in q:
            shoes_qty = sum(qty for name, qty in product_sales.items() if "shoe" in name.lower())
            return f"We have sold **{shoes_qty} shoes** in total today."

        # Default fallback conversation
        return (
            f"Here is a summary of the business operations:\n"
            f"- **Total Revenue**: ${total_revenue:,.2f}\n"
            f"- **Total Orders**: {total_orders}\n"
            f"- **Top Selling Product**: {top_product}\n"
            f"- **Low Stock Items**: {len(low_stock_items)} items.\n\n"
            f"How else can I help you analyze the store operations?"
        )

    # Real OpenAI Chat
    try:
        context = {
            "current_inventory": [
                {
                    "name": p.get("name"),
                    "category": p.get("category"),
                    "price": p.get("price"),
                    "stock": p.get("stock"),
                    "sku": p.get("sku")
                }
                for p in inventory_data
            ],
            "recent_orders": [
                {
                    "orderId": s.get("orderId"),
                    "customerName": s.get("customerName"),
                    "total": s.get("total"),
                    "status": s.get("status"),
                    "products": s.get("products")
                }
                for s in sales_data
            ]
        }
        
        system_prompt = (
            "You are RetailMind AI, the central manager AI for smart retail operations.\n"
            "You have access to current inventory and recent sales data.\n"
            "Answer the business owner's question precisely and professionally based on the data. "
            "Use clear Markdown formatting, including bullet points or bold text, to make the answer highly readable."
        )
        
        user_message = (
            f"Data Context:\n{json.dumps(context, indent=2)}\n\n"
            f"Question: {question}"
        )
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            temperature=0.3
        )
        
        return response.choices[0].message.content
    except Exception as e:
        print(f"[AI Service] OpenAI error during chat: {e}")
        return f"I encountered an error trying to process that request: {e}. Running local database metrics show {len(sales_data)} orders recorded."
