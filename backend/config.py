import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

PORT = int(os.getenv("PORT", 8000))
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
FIREBASE_CREDENTIALS = os.getenv("FIREBASE_CREDENTIALS", "firebase-service-account.json")

# Determine whether mock services should be used
use_mock_raw = os.getenv("USE_MOCK_SERVICES", "true").lower()
USE_MOCK_SERVICES = use_mock_raw in ("true", "1", "yes")

# Force AI mock if key is missing
USE_MOCK_AI = USE_MOCK_SERVICES or not OPENAI_API_KEY

# Force Firebase mock if credential file is missing and not already mocking everything
firebase_creds_exist = os.path.exists(FIREBASE_CREDENTIALS)
USE_MOCK_DB = USE_MOCK_SERVICES or not firebase_creds_exist

print("--------------------------------------------------")
print("RetailMind AI Backend Config:")
print(f"  Port: {PORT}")
print(f"  Mock Services: {USE_MOCK_SERVICES}")
print(f"  Mock AI: {USE_MOCK_AI} (OpenAI Key: {'Configured' if OPENAI_API_KEY else 'NOT Configured'})")
print(f"  Mock Database: {USE_MOCK_DB} (Cred File Exist: {firebase_creds_exist})")
print("--------------------------------------------------")
