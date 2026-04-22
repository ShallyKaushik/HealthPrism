import os
import json
import chromadb
from chromadb.utils import embedding_functions
from openai import OpenAI

class NutritionRAGService:
    def __init__(self):
        # Initialize paths and clients
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.db_path = os.path.join(self.base_dir, "chroma_db")
        self.knowledge_file = os.path.join(self.base_dir, "data", "nutrition_knowledge.txt")
        self.api_key = os.getenv("OPENAI_API_KEY")
        
        self.collection_name = "nutrition_knowledge"
        self.client = None
        self.collection = None
        self.embedding_fn = None
        
        if self.api_key:
            self._setup_db()
            
    def _setup_db(self):
        try:
            # We persist ChromaDB to disk so we don't re-embed the text file every cold start
            self.client = chromadb.PersistentClient(path=self.db_path)
            
            # Use OpenAI embeddings 
            self.embedding_fn = embedding_functions.OpenAIEmbeddingFunction(
                api_key=self.api_key,
                model_name="text-embedding-3-small"
            )
            
            # Check if collection exists
            collections = [c.name for c in self.client.list_collections()]
            if self.collection_name not in collections:
                # Create and populate
                self.collection = self.client.create_collection(
                    name=self.collection_name, 
                    embedding_function=self.embedding_fn
                )
                self._populate_knowledge_base()
            else:
                self.collection = self.client.get_collection(
                    name=self.collection_name, 
                    embedding_function=self.embedding_fn
                )
                print("ChromaDB Nutrition Collection loaded from cache.")
                
        except Exception as e:
            print(f"Warning: RAG DB Setup Failed. {e}")
            self.client = None
            
    def _populate_knowledge_base(self):
        if not os.path.exists(self.knowledge_file):
            print("Knowledge file missing. Cannot populate DB.")
            return
            
        with open(self.knowledge_file, "r") as f:
            content = f.read()
            
        # Split by double newline to separate the major headers
        chunks = [chunk.strip() for chunk in content.split("\n\n") if chunk.strip()]
        
        if not chunks:
            return
            
        ids = [f"nutri_chunk_{i}" for i in range(len(chunks))]
        
        try:
            self.collection.add(
                documents=chunks,
                ids=ids
            )
            print("Successfully embedded and cached nutrition knowledge base into ChromaDB.")
        except Exception as e:
            print(f"Failed to populate knowledge base: {e}")

    def build_nutrition_plan(self, user_data):
        """
        Creates a highly personalized 3-day meal plan using RAG and strict validation.
        """
        if not self.api_key:
            return self._get_fallback_plan(user_data)
            
        goal = user_data.get('goal', 'health')
        diet_type = user_data.get('diet_type', 'vegetarian')
        cuisine = user_data.get('cuisine', 'Indian')
        allergies = user_data.get('allergies', 'none')
        disliked_foods = user_data.get('disliked_foods', 'none')
        risk_level = user_data.get('risk_level', 'Low')
        calories = user_data.get('calories', 'contextual')

        query_text = f"Guidelines for {goal}, {diet_type} {cuisine} diet, {risk_level} heart risk."
        if calories and calories != 'contextual':
            query_text += f" Target: {calories} calories."
        query_text += f" Avoid {allergies} and {disliked_foods}."
        retrieved_context = ""
        
        if self.collection:
            try:
                results = self.collection.query(query_texts=[query_text], n_results=3)
                if results['documents'] and len(results['documents'][0]) > 0:
                    retrieved_context = " ".join(results['documents'][0])
            except Exception as e:
                print(f"RAG Retrieval failed: {e}")
                
        openai_client = OpenAI(api_key=self.api_key)
        
        system_prompt = (
            "You are a premium AI Nutritionist. Generate a STRICT 3-DAY meal plan following these rules:\n\n"
            "STRICT DIET RULES:\n"
            f"- Vegetarian: NO meat, chicken, fish, seafood, or eggs.\n"
            f"- Vegan: NO animal products.\n"
            f"- Cuisine: strictly {cuisine}.\n"
            f"- Respect Allergies ({allergies}) and Disliked Foods ({disliked_foods}) completely.\n\n"
            "Output EXACTLY in this JSON format:\n"
            "{\n"
            '  "summary": { "goal": "...", "risk_level": "...", "focus": ["...", "..."] },\n'
            '  "principles": ["..."],\n'
            '  "days": [\n'
            '    {\n'
            '      "day": 1,\n'
            '      "meals": {\n'
            '        "breakfast": { "main": "...", "why": "...", "tags": ["High Fiber", "Low Fat"], "alternatives": ["Alt 1", "Alt 2"] },\n'
            '        "lunch": { "main": "...", "why": "...", "tags": [], "alternatives": ["Alt 1", "Alt 2"] },\n'
            '        "dinner": { "main": "...", "why": "...", "tags": [], "alternatives": ["Alt 1", "Alt 2"] }\n'
            '      }\n'
            '    },\n'
            '    { "day": 2, "meals": {...} },\n'
            '    { "day": 3, "meals": {...} }\n'
            '  ]\n'
            "}"
        )
        
        user_info = f"Goal: {goal}, Diet: {diet_type}, Cuisine: {cuisine}, Risk: {risk_level}, Cals: {calories}"
        user_prompt = f"{user_info}\n\nContext:\n{retrieved_context}\n\n" + \
                      "Generate a 3-DAY plan using the provided JSON structure. DO NOT explain, just return JSON."

        try:
            from .ai_router import ai_router
            response_text = ai_router.generate_response(
                query=user_prompt,
                user_data=user_data,
                history=[], # No chat history needed for plan generation
                context=system_prompt, # We use the strict formatting rules as context
                force_json=True
            )
            
            # Extract JSON from the response text
            # (Router returns raw string, we might need a simple cleaner if model wraps in code blocks)
            clean_json = response_text.replace("```json", "").replace("```", "").strip()
            plan = json.loads(clean_json)
            
            # Validation Step
            if self.validate_plan(plan, diet_type):
                return plan
            else:
                print("Validation failed: AI output violated dietary rules. Falling back...")
                return self._get_fallback_plan(user_data)
                
        except Exception as e:
            print(f"Nutrition Generation Error: {e}")
            return self._get_fallback_plan(user_data)

    def validate_plan(self, plan, diet_type):
        """Checks if the AI output contains forbidden words for the diet type."""
        forbidden_maps = {
            "vegetarian": ["chicken", "fish", "egg", "meat", "beef", "pork", "seafood", "shrimp", "steak"],
            "vegan": ["chicken", "fish", "egg", "meat", "beef", "pork", "seafood", "milk", "cheese", "butter", "honey", "yogurt", "ghee"]
        }
        
        rules = forbidden_maps.get(diet_type.lower())
        if not rules:
            return True # No rules for non-veg
            
        plan_str = json.dumps(plan).lower()
        for word in rules:
            if word in plan_str:
                print(f"Forbidden word '{word}' found in plan for diet '{diet_type}'")
                return False
        return True

    def _get_fallback_plan(self, user_data):
        cuisine = user_data.get('cuisine', 'Indian').lower()
        diet = user_data.get('diet_type', 'vegetarian').lower()
        
        if 'indian' in cuisine:
            return self._get_indian_fallback(diet)
        else:
            return self._get_western_fallback(diet)

    def _get_indian_fallback(self, diet):
        return {
            "summary": { "goal": "Health & Satiety", "risk_level": "Safe", "focus": ["Whole Grains", "Plant Protein"] },
            "principles": ["Low Sodium", "High Fiber", "Home Cooked"],
            "days": [
                {
                    "day": 1,
                    "meals": {
                        "breakfast": { "main": "Vegetable Poha", "why": "Light and energized start.", "tags": ["Indian", "Quick"], "alternatives": ["Upma", "Oats Khichdi"] },
                        "lunch": { "main": "Moong Dal & Palak with Roti", "why": "Balanced protein and iron.", "tags": ["Protein Rich", "Traditional"], "alternatives": ["Paneer Bhurji", "Chana Masala"] },
                        "dinner": { "main": "Mixed Vegetable Khichdi", "why": "Easy to digest dinner.", "tags": ["Light", "Nutritious"], "alternatives": ["Dal Soup", "Stir-fry Veggies"] }
                    }
                },
                {
                    "day": 2,
                    "meals": {
                        "breakfast": { "main": "Idli with Sambar", "why": "Fermented food for gut health.", "tags": ["High Fiber", "Traditional"], "alternatives": ["Dosa", "Appam"] },
                        "lunch": { "main": "Bhindi Masala & Multigrain Roti", "why": "Fiber-rich vegetables.", "tags": ["Low Fat", "Vibrant"], "alternatives": ["Aloo Beans", "Lauki Ki Sabzi"] },
                        "dinner": { "main": "Lauki Chana Dal & Roti", "why": "Hydrating and heart-healthy.", "tags": ["Heart Healthy", "Light"], "alternatives": ["Vegetable Clear Soup", "Dalia"] }
                    }
                },
                {
                    "day": 3,
                    "meals": {
                        "breakfast": { "main": "Multigrain Cheela", "why": "Protein-dense morning meal.", "tags": ["Protein Rich", "Indian"], "alternatives": ["Besan Puda", "Moong Dal Toast"] },
                        "lunch": { "main": "Rajma Masala & Steamed Brown Rice", "why": "Complex carbs and fiber.", "tags": ["Fiber Rich", "Wholesome"], "alternatives": ["Kadi Pakora", "Soya Chunks Curry"] },
                        "dinner": { "main": "Grilled Paneer & Sauteed Veggies", "why": "Low carb evening meal.", "tags": ["Low Carb", "Protein Rich"], "alternatives": ["Sprouted Salad", "Mushroom Soup"] }
                    }
                }
            ],
            "warnings": ["Active safety fallback triggered: Using curated medical-grade 3-day Indian templates."]
        }

    def _get_western_fallback(self, diet):
        return {
            "summary": { "goal": "Heart Healthy", "risk_level": "Safe", "focus": ["Leafy Greens", "Antioxidants"] },
            "principles": ["Fresh Produce", "No Processed Sugar", "Lean Prep"],
            "days": [
                {
                    "day": 1,
                    "meals": {
                        "breakfast": { "main": "Steel Cut Oats with Berries", "why": "High fiber for heart health.", "tags": ["Fiber", "Antioxidant"], "alternatives": ["Greek Yogurt", "Chia Pudding"] },
                        "lunch": { "main": "Quinoa & Roasted Veggie Salad", "why": "Complex carbs for sustained energy.", "tags": ["Gluten Free", "Nutrient Dense"], "alternatives": ["Chickpea Wrap", "Lentil Soup"] },
                        "dinner": { "main": "Baked Tofu with Broccoli and Brown Rice", "why": "Complete protein with low fat.", "tags": ["Vegan Friendly", "Low Calorie"], "alternatives": ["Zucchini Noodles", "Mushroom Risotto"] }
                    }
                },
                {
                    "day": 2,
                    "meals": {
                        "breakfast": { "main": "Avocado Toast on Whole Grain", "why": "Healthy fats for heart.", "tags": ["Healthy Fats", "Modern"], "alternatives": ["Smoothie Bowl", "Whole Grain Waffles"] },
                        "lunch": { "main": "Mediterranean Chickpea Salad", "why": "Rich in healthy fats and proteins.", "tags": ["Heart Healthy", "Mediterranean"], "alternatives": ["Hummus Platter", "Falafel Bowl"] },
                        "dinner": { "main": "Sweet Potato & Black Bean Bowl", "why": "Fiber-rich evening energy.", "tags": ["High Fiber", "Vibrant"], "alternatives": ["Lentil Pasta", "Stuffed Peppers"] }
                    }
                },
                {
                    "day": 3,
                    "meals": {
                        "breakfast": { "main": "Smoothie with Spinach & Banana", "why": "Hydrating and nutrient-dense.", "tags": ["Hydrating", "Quick"], "alternatives": ["Fruit Salad", "Energy Bar"] },
                        "lunch": { "main": "Lentil & Vegetable Hearty Soup", "why": "Slow-release energy.", "tags": ["Wholesome", "Low Fat"], "alternatives": ["Quinoa Tabbouleh", "Veggie Burger"] },
                        "dinner": { "main": "Eggplant Parmesan (Lightened)", "why": "Delicious and nutrient-rich.", "tags": ["Comfort Food", "Vegetarian"], "alternatives": ["Caprese Salad", "Ratatouille"] }
                    }
                }
            ],
            "warnings": ["Active safety fallback triggered: Using curated medical-grade 3-day Western templates."]
        }

# Singleton instance
rag_service = NutritionRAGService()
