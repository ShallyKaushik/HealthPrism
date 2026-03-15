import os
from pymongo import MongoClient
from dotenv import load_dotenv
import sys

load_dotenv()
mongo_uri = os.getenv("MONGO_URI")
print(f"Testing connection to: {mongo_uri}")

try:
    client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
    # The ismaster command is cheap and does not require auth.
    client.admin.command('ismaster')
    print("MongoDB connection successful!")
    print(f"Databases: {client.list_database_names()}")
except Exception as e:
    print(f"MongoDB connection failed: {e}")
    sys.exit(1)
