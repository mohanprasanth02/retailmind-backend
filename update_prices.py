import re

# Update mock_db.py
with open(r'e:\Study\New folder\backend\mock_db.py', 'r', encoding='utf-8') as f:
    content = f.read()

def replacer(match):
    price_val = float(match.group(1))
    # Multiply by 83 for INR conversion and round to nearest whole number
    new_price = round(price_val * 83)
    # Add .0 or .00 to maintain float appearance
    return f'\"price\": {new_price}.00'

new_content = re.sub(r'\"price\":\s*([\d\.]+)', replacer, content)

with open(r'e:\Study\New folder\backend\mock_db.py', 'w', encoding='utf-8') as f:
    f.write(new_content)

# Update firebase_service.dart
with open(r'e:\Study\New folder\mobile\lib\services\firebase_service.dart', 'r', encoding='utf-8') as f:
    dart_content = f.read()

def dart_replacer(match):
    price_val = float(match.group(1))
    new_price = round(price_val * 83)
    return f'\"price\": {new_price}.0'

new_dart_content = re.sub(r'\"price\":\s*([\d\.]+)', dart_replacer, dart_content)

with open(r'e:\Study\New folder\mobile\lib\services\firebase_service.dart', 'w', encoding='utf-8') as f:
    f.write(new_dart_content)

print('Prices updated successfully!')
