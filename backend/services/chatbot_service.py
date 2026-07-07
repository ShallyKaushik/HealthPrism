import os
import json
import random
import requests
import chromadb
from chromadb.utils import embedding_functions
from openai import OpenAI


# ---------------------------------------------------------------------------
# Health-Domain Guardrail — keyword + intent classifier
# ---------------------------------------------------------------------------
HEALTH_KEYWORDS = {
    # general health
    "health", "healthy", "medical", "medicine", "doctor", "hospital", "clinic",
    "symptom", "symptoms", "diagnosis", "treatment", "therapy", "disease",
    "condition", "illness", "sick", "pain", "ache", "chronic", "acute",
    # cardio
    "heart", "cardiac", "cardiovascular", "cholesterol", "blood pressure",
    "hypertension", "artery", "arteries", "pulse", "heartbeat", "bpm", "ecg",
    "rppg", "palpitations", "angina", "stroke", "atherosclerosis",
    # nutrition
    "diet", "nutrition", "calorie", "calories", "protein", "carbs",
    "carbohydrate", "fat", "fats", "fiber", "vitamin", "mineral", "iron",
    "calcium", "zinc", "potassium", "sodium", "omega", "antioxidant",
    "meal", "food", "eat", "eating", "recipe", "cook", "vegetarian",
    "vegan", "gluten", "lactose", "allergy", "allergies", "supplement",
    "hydration", "water", "dehydration", "macros", "micronutrient",
    # mental health
    "stress", "anxiety", "depression", "mental", "mood", "mindfulness",
    "meditation", "yoga", "breathing", "therapy", "counseling", "burnout",
    "insomnia", "sleep", "relaxation", "self-care", "wellbeing", "wellness",
    "cortisol", "serotonin", "dopamine", "panic", "ptsd",
    # fitness
    "exercise", "workout", "fitness", "gym", "running", "walking",
    "cardio", "strength", "stretching", "flexibility", "muscles",
    "endurance", "aerobic", "weight", "bmi", "obesity", "overweight",
    "underweight", "body fat",
    # diabetes
    "diabetes", "insulin", "glucose", "blood sugar", "hba1c", "glycemic",
    "prediabetes", "diabetic",
    # respiratory
    "lung", "lungs", "respiratory", "breathing", "asthma", "copd",
    "pneumonia", "cough", "oxygen", "inhaler",
    # digestive
    "digestion", "digestive", "stomach", "gut", "intestine", "constipation",
    "diarrhea", "ibs", "gerd", "acid reflux", "probiotics", "fiber",
    # women/men health
    "pregnancy", "menstruation", "menopause", "prenatal", "postnatal",
    "prostate", "fertility", "hormones",
    # skin
    "skin", "dermatology", "sunscreen", "acne", "eczema", "rash",
    # dental
    "dental", "teeth", "gums", "oral health", "toothache", "cavity",
    # general preventive
    "vaccine", "vaccination", "screening", "check-up", "checkup",
    "immunity", "immune", "infection", "fever", "inflammation",
    "cancer", "tumor", "biopsy",
    # app-specific
    "healthprism", "risk score", "heart risk", "stress level",
    "nutrition plan", "meal plan",
    # greetings / small talk that should still be answered warmly
    "hello", "hi", "hey", "thanks", "thank you", "bye", "goodbye",
    "how are you", "help", "what can you do", "who are you",
}

NON_HEALTH_KEYWORDS = {
    "javascript", "python", "java", "code", "coding", "programming",
    "html", "css", "react", "angular", "node", "sql", "database",
    "algorithm", "api", "git", "github", "bitcoin", "crypto",
    "stock market", "trading", "forex", "politics", "election",
    "president", "movie", "film", "game", "gaming", "sports score",
    "football", "cricket", "soccer", "baseball", "basketball",
    "weather forecast", "recipe for pasta", "travel", "hotel",
    "flight", "car", "motorcycle", "phone", "laptop", "iphone",
    "android app", "windows", "linux", "macos", "photoshop",
    "illustrator", "tiktok", "instagram", "facebook", "twitter",
    "snapchat", "youtube", "netflix", "spotify", "amazon",
    "ecommerce", "shopping", "fashion", "clothing", "shoes",
    "real estate", "mortgage", "loan", "banking",
    "astrology", "horoscope", "zodiac",
    "poetry", "essay", "story", "novel", "homework", "assignment",
    "math", "physics", "chemistry", "calculus", "algebra",
}

REFUSAL_RESPONSES = [
    "I'm HealthPrism AI — I'm specifically designed to help with health, nutrition, fitness, mental wellness, and medical-related questions. Could you ask me something in that area instead? 🩺",
    "That's outside my area of expertise! I focus exclusively on health and wellness topics — things like heart health, nutrition, stress management, exercise, sleep, and preventive care. How can I help you with your health today? 💚",
    "I appreciate the curiosity, but I'm built to answer only health-related questions. Try asking me about diet plans, heart risk, stress relief, sleep tips, or fitness advice! 🏥",
    "That topic falls outside my health & wellness domain. I can help you with nutrition guidance, exercise plans, stress management, sleep health, disease prevention, and more. What health question can I assist with? 🌿",
]


def is_health_related(query: str) -> bool:
    """
    Determines if the user's query is health-related using keyword matching.
    Returns True if the query is health-related, False otherwise.
    """
    query_lower = query.lower().strip()
    
    # Very short queries (greetings etc.) — allow through
    if len(query_lower.split()) <= 3:
        # Check if it's a greeting or basic interaction
        greetings = {"hello", "hi", "hey", "thanks", "thank you", "bye", 
                     "goodbye", "help", "ok", "okay", "yes", "no", "sure"}
        if any(g in query_lower for g in greetings):
            return True
    
    # Check for explicit non-health keywords first
    for kw in NON_HEALTH_KEYWORDS:
        if kw in query_lower:
            # Double-check: some non-health keywords may appear in health context
            # e.g., "python" in "python venom health effects"
            health_hit = any(hk in query_lower for hk in HEALTH_KEYWORDS)
            if not health_hit:
                return False
    
    # Check for health keywords
    for kw in HEALTH_KEYWORDS:
        if kw in query_lower:
            return True
    
    # If no clear signal, default to allowing it (the LLM system prompt
    # will still enforce health-only in its response)
    # But for very long queries with no health keywords, reject
    if len(query_lower.split()) > 5:
        return False
    
    # For short ambiguous queries, allow through and let the LLM handle it
    return True


# ---------------------------------------------------------------------------
# RAG Chatbot Service
# ---------------------------------------------------------------------------

class ChatbotService:
    def __init__(self):
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.db_path = os.path.join(self.base_dir, "chroma_db")
        self.openai_key = os.getenv("OPENAI_API_KEY")
        self.gemini_key = os.getenv("GEMINI_API_KEY")
        
        self.collection_name = "health_rag_knowledge_v2"
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
            else:
                print(f"RAG KB loaded from cache: {self.collection.count()} chunks.")
                
        except Exception as e:
            print(f"Chatbot RAG Setup Failed: {e}")
            self.client = None

    def _populate_knowledge_base(self):
        """Load ALL health knowledge files and chunk them for embedding."""
        knowledge_files = [
            "health_knowledge_base.txt",
            "nutrition_knowledge.txt",
            "health_guidelines.txt",
            "stress_management.txt",
        ]
        
        all_chunks = []
        all_ids = []
        all_metadata = []
        
        for filename in knowledge_files:
            file_path = os.path.join(self.base_dir, "data", filename)
            if not os.path.exists(file_path):
                print(f"Knowledge file missing: {file_path}")
                continue
                
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            
            # Chunk by double newline
            chunks = [c.strip() for c in content.split("\n\n") if c.strip() and len(c.strip()) > 30]
            
            for i, chunk in enumerate(chunks):
                chunk_id = f"{filename.replace('.txt', '')}_{i}"
                all_chunks.append(chunk)
                all_ids.append(chunk_id)
                all_metadata.append({
                    "source": filename,
                    "chunk_index": i
                })
        
        if all_chunks:
            # ChromaDB has a batch limit, so add in batches of 40
            batch_size = 40
            for start in range(0, len(all_chunks), batch_size):
                end = min(start + batch_size, len(all_chunks))
                self.collection.add(
                    documents=all_chunks[start:end],
                    ids=all_ids[start:end],
                    metadatas=all_metadata[start:end]
                )
            print(f"RAG Knowledge Base populated with {len(all_chunks)} chunks from {len(knowledge_files)} files.")

    def get_relevant_context(self, query, n_results=5):
        """Retrieve semantically relevant health knowledge chunks."""
        if not self.collection:
            return ""
        try:
            results = self.collection.query(
                query_texts=[query],
                n_results=n_results
            )
            if results and results['documents'] and results['documents'][0]:
                # Combine with source attribution
                context_parts = []
                for i, doc in enumerate(results['documents'][0]):
                    source = ""
                    if results.get('metadatas') and results['metadatas'][0]:
                        source = results['metadatas'][0][i].get('source', '')
                    context_parts.append(f"[Source: {source}]\n{doc}")
                return "\n\n---\n\n".join(context_parts)
            return ""
        except Exception as e:
            print(f"RAG Retrieval Error: {e}")
            return ""

    def generate_chat_response(self, query, user_data, history):
        """
        Main entry point: guardrail check → RAG retrieval → LLM generation.
        """
        # ── Step 0: Health domain guardrail ──
        if not is_health_related(query):
            return random.choice(REFUSAL_RESPONSES)
        
        # ── Step 1: Retrieve relevant context from RAG ──
        rag_context = self.get_relevant_context(query)
        
        # ── Step 2: Build the augmented prompt with strict health-only system instructions ──
        system_prompt = self._build_system_prompt(rag_context, user_data)
        
        # ── Step 3: Generate via AI Router with tiered failover ──
        from .ai_router import ai_router
        return ai_router.generate_response(
            query=query,
            user_data=user_data,
            history=history,
            context=system_prompt
        )

    def _build_system_prompt(self, rag_context, user_data):
        """Build a comprehensive system prompt with RAG context and strict guardrails."""
        prompt = (
            "You are HealthPrism AI — a premium, domain-specific health assistant.\n\n"
            
            "## ABSOLUTE RULES (NEVER VIOLATE):\n"
            "1. You MUST ONLY answer questions related to health, medicine, nutrition, "
            "fitness, mental wellness, sleep, stress management, disease prevention, "
            "and general well-being.\n"
            "2. If the user asks about ANY topic outside health (programming, politics, "
            "entertainment, technology, math, etc.), you MUST politely refuse and redirect "
            "them to ask a health-related question instead.\n"
            "3. NEVER provide specific medical diagnoses. Always recommend consulting "
            "a healthcare professional for serious concerns.\n"
            "4. Use the RETRIEVED KNOWLEDGE below to ground your answers in factual, "
            "evidence-based information. Do NOT hallucinate facts.\n"
            "5. Keep responses warm, supportive, and professional.\n"
            "6. Format responses with clear structure — use bullet points and short "
            "paragraphs for readability.\n\n"
        )
        
        if rag_context:
            prompt += (
                "## RETRIEVED HEALTH KNOWLEDGE (use this to answer):\n"
                f"{rag_context}\n\n"
            )
        
        if user_data:
            prompt += (
                "## USER HEALTH PROFILE:\n"
                f"{json.dumps(user_data, indent=2)}\n\n"
            )
        
        prompt += (
            "## RESPONSE GUIDELINES:\n"
            "- Personalize advice based on the user's profile when available.\n"
            "- Reference their risk level and health goals naturally.\n"
            "- If the retrieved knowledge contains relevant info, cite it.\n"
            "- For greetings, respond warmly and ask how you can help with their health.\n"
            "- Always end complex health answers with a gentle reminder to consult "
            "a healthcare professional if needed.\n"
        )
        
        return prompt


# Singleton
chatbot_service = ChatbotService()
