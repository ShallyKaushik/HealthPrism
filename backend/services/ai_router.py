import os
import json
import random
import requests
from openai import OpenAI

class AIRouter:
    def __init__(self):
        self.openai_key = os.getenv("OPENAI_API_KEY")
        self.groq_key = os.getenv("GROQ_API_KEY")
        self.gemini_key = os.getenv("GEMINI_API_KEY")

        # Models
        self.openai_model = "gpt-4o-mini"
        self.groq_model = "llama-3.3-70b-versatile"
        self.gemini_model = "gemini-2.5-flash"

        # Clients
        self.openai_client = OpenAI(api_key=self.openai_key) if self.openai_key else None
        
        # Groq uses OpenAI compatible SDK
        self.groq_client = OpenAI(
            base_url="https://api.groq.com/openai/v1",
            api_key=self.groq_key
        ) if self.groq_key and not self.groq_key.startswith("gsk_.") else None

    def _classify_query(self, query):
        """
        Determines if a query is 'simple' (definitions, greeting) 
        or 'complex' (personal analysis, health advice).
        """
        query_lower = query.lower()
        complex_keywords = [
            "analyze", "analysis", "heart", "risk", "stress", 
            "profile", "history", "recommend", "plan", "advice",
            "prediction", "assessment"
        ]
        
        is_complex = any(kw in query_lower for kw in complex_keywords)
        is_long = len(query.split()) > 10
        
        return "complex" if (is_complex or is_long) else "simple"

    def _format_unified_prompt(self, query, user_data, history, context):
        """
        Creates a shared prompt template for all models.
        """
        history_str = ""
        if isinstance(history, list):
            for msg in history[-10:]:
                role = "User" if msg.get('role') == 'user' else "Assistant"
                history_str += f"{role}: {msg.get('content')}\n"
        
        prompt = (
            "You are HealthPrism AI, a premium personalized health assistant.\n\n"
            "## USER PROFILE:\n"
            f"{json.dumps(user_data, indent=2)}\n\n"
            "## CONTEXT / GUIDELINES:\n"
            f"{context if context else 'General medical knowledge.'}\n\n"
            "## RECENT HISTORY:\n"
            f"{history_str if history_str else 'No previous conversation.'}\n\n"
            "## INSTRUCTIONS:\n"
            "- Provide personalized, clear, and actionable advice.\n"
            "- Reference user goals and risk profile naturally.\n"
            "- Keep responses supportive and professional.\n\n"
            f"USER QUERY: {query}\n"
            "ASSISTANT RESPONSE:"
        )
        return prompt

    def generate_response(self, query, user_data, history, context="", force_json=False):
        """
        Main entry point for AI responses with Tiered Failover.
        """
        classification = self._classify_query(query)
        prompt = self._format_unified_prompt(query, user_data, history, context)
        
        # Routing Logic
        if classification == "simple":
            providers = ["groq", "openai", "gemini"]
        else:
            providers = ["openai", "groq", "gemini"]

        last_error = None
        
        for provider in providers:
            try:
                if provider == "openai":
                    return self._call_openai(prompt, force_json)
                elif provider == "groq":
                    return self._call_groq(prompt, force_json)
                elif provider == "gemini":
                    return self._call_gemini(query, prompt) # Gemini handles history/system slightly differently
            except Exception as e:
                print(f"--- {provider.upper()} FAILED: {str(e)} ---")
                last_error = str(e)
                continue

        # Ultimate Fallback
        return self._get_safety_fallback(user_data)

    def _call_openai(self, prompt, force_json=False):
        if not self.openai_client: raise Exception("OpenAI Client not initialized")
        
        # Try once
        try:
            return self._execute_openai(prompt, force_json)
        except Exception:
            # Retry once
            print("--- OPENAI RETRYING ---")
            return self._execute_openai(prompt, force_json)

    def _execute_openai(self, prompt, force_json=False):
        params = {
            "model": self.openai_model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.7,
            "max_tokens": 800
        }
        if force_json:
            params["response_format"] = {"type": "json_object"}
            
        response = self.openai_client.chat.completions.create(**params)
        return response.choices[0].message.content

    def _call_groq(self, prompt, force_json=False):
        if not self.groq_client: raise Exception("Groq Client not initialized (check key)")
        
        params = {
            "model": self.groq_model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.6,
            "max_tokens": 800
        }
        # Note: Groq compatibility layer might not support response_format: json_object perfectly across all models
        # but we use system instruction hacks if needed.
        
        response = self.groq_client.chat.completions.create(**params)
        return response.choices[0].message.content

    def _call_gemini(self, query, prompt):
        if not self.gemini_key: raise Exception("Gemini Key not initialized")
        
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.gemini_model}:generateContent"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}]
        }
        headers = {
            'Content-Type': 'application/json',
            'x-goog-api-key': self.gemini_key 
        }
        
        response = requests.post(url, json=payload, headers=headers, timeout=15)
        response.raise_for_status()
        result = response.json()
        return result.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')

    def _get_safety_fallback(self, user_data):
        name = user_data.get('fullname', 'User').split(' ')[0]
        diet = user_data.get('diet_type', 'balanced health')
        goal = user_data.get('goal', 'wellness')
        
        fallbacks = [
            f"Hi {name}, I'm currently working with simplified data. For your {diet} focus and {goal} goal, continue focusing on fresh produce and hydration. I'll have more specific insights once my advanced systems reconnect.",
            f"I'm operating in safety mode, {name}. Based on your profile, stay consistent with your {goal} plan. Please try your detailed health query again in a few minutes.",
        ]
        return random.choice(fallbacks)

# Singleton Instance
ai_router = AIRouter()
