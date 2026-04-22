import os
import json
import random
import requests
import chromadb
from chromadb.utils import embedding_functions
from openai import OpenAI

class ChatbotService:
    def __init__(self):
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.db_path = os.path.join(self.base_dir, "chroma_db")
        self.openai_key = os.getenv("OPENAI_API_KEY")
        self.gemini_key = os.getenv("GEMINI_API_KEY")
        
        self.collection_name = "general_health_knowledge"
        self.client = None
        self.collection = None
        self.embedding_fn = None
        
        if self.openai_key:
            self._setup_db()
            
    def _setup_db(self):
        try:
            self.client = chromadb.PersistentClient(path=self.db_path)
            self.embedding_fn = embedding_functions.OpenAIEmbeddingFunction(
                api_key=self.openai_key,
                model_name="text-embedding-3-small"
            )
            
            # Use get_or_create to simplify
            self.collection = self.client.get_or_create_collection(
                name=self.collection_name,
                embedding_function=self.embedding_fn
            )
            
            # Check if we need to populate (simple count check)
            if self.collection.count() == 0:
                self._populate_knowledge_base()
                
        except Exception as e:
            print(f"Chatbot RAG Setup Failed: {e}")
            self.client = None

    def _populate_knowledge_base(self):
        knowledge_files = [
            "nutrition_knowledge.txt",
            "health_guidelines.txt",
            "stress_management.txt"
        ]
        
        all_chunks = []
        all_ids = []
        
        for filename in knowledge_files:
            file_path = os.path.join(self.base_dir, "data", filename)
            if os.path.exists(file_path):
                with open(file_path, "r") as f:
                    content = f.read()
                    # Chunk by double newline
                    chunks = [c.strip() for c in content.split("\n\n") if c.strip()]
                    for i, chunk in enumerate(chunks):
                        all_chunks.append(chunk)
                        all_ids.append(f"{filename.split('.')[0]}_{i}")
        
        if all_chunks:
            self.collection.add(documents=all_chunks, ids=all_ids)
            print(f"Chatbot KB populated with {len(all_chunks)} chunks.")

    def get_relevant_context(self, query):
        if not self.collection:
            return ""
        try:
            results = self.collection.query(query_texts=[query], n_results=3)
            return "\n\n".join(results['documents'][0]) if results['documents'] else ""
        except Exception as e:
            print(f"RAG Retrieval Error: {e}")
            return ""

    def generate_chat_response(self, query, user_data, history):
        """
        Generates a personalized response using the AIRouter (OpenAI -> Groq -> Gemini).
        """
        # 1. Get Context from RAG
        context = self.get_relevant_context(query)
        
        # 2. Delegate to AI Router for tiered response generation
        from .ai_router import ai_router
        return ai_router.generate_response(
            query=query,
            user_data=user_data,
            history=history,
            context=context
        )

# Singleton
chatbot_service = ChatbotService()

# Singleton
chatbot_service = ChatbotService()
