import requests
import json
import logging
from backend.database import get_setting

# Set up logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AIHandler")

class KeyRotator:
    def __init__(self, provider):
        self.provider = provider
        self.keys = []
        self.current_index = 0
        self.load_keys()

    def load_keys(self):
        """Loads API keys from the database settings."""
        # Mapping provider names to database setting keys
        db_keys = {
            "gemini": "gemini_keys",
            "openai": "openai_keys",
            "groq": "groq_keys",
            "deepseek": "deepseek_keys",
            "openrouter": "openrouter_keys"
        }
        
        db_key = db_keys.get(self.provider.lower())
        if not db_key:
            self.keys = []
            return
            
        value = get_setting(db_key, "")
        if value:
            # Split comma separated keys and clean whitespaces
            self.keys = [k.strip() for k in value.split(",") if k.strip()]
        else:
            self.keys = []
        self.current_index = 0
        logger.info(f"Loaded {len(self.keys)} keys for {self.provider}")

    def get_next_key(self):
        """Gets the next key in round-robin fashion, or None if no keys are loaded."""
        # Always reload keys to get the latest settings
        self.load_keys()
        
        if not self.keys:
            return None
            
        key = self.keys[self.current_index]
        self.current_index = (self.current_index + 1) % len(self.keys)
        return key

# Dict of rotators for each provider
rotators = {
    "gemini": KeyRotator("gemini"),
    "openai": KeyRotator("openai"),
    "groq": KeyRotator("groq"),
    "deepseek": KeyRotator("deepseek"),
    "openrouter": KeyRotator("openrouter")
}

def generate_with_gemini(api_key, prompt):
    """Calls the Google Gemini API directly using requests."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [{
            "parts": [{
                "text": prompt
            }]
        }]
    }
    
    response = requests.post(url, headers=headers, json=payload, timeout=15)
    response.raise_for_status()
    data = response.json()
    
    try:
        return data["candidates"][0]["content"]["parts"][0]["text"].strip()
    except (KeyError, IndexError) as e:
        raise ValueError(f"Unexpected response structure from Gemini API: {data}")

def generate_with_openai_compatible(api_key, base_url, model, prompt):
    """Calls an OpenAI-compatible API directly using requests."""
    url = f"{base_url.rstrip('/')}/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": "Você é um especialista em vendas e redação de copywriting (copywriter) para WhatsApp."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        "temperature": 0.7
    }
    
    response = requests.post(url, headers=headers, json=payload, timeout=20)
    response.raise_for_status()
    data = response.json()
    
    try:
        return data["choices"][0]["message"]["content"].strip()
    except (KeyError, IndexError) as e:
        raise ValueError(f"Unexpected response structure from OpenAI compatible API: {data}")

def call_ai_with_rotation(prompt, provider="gemini"):
    """
    Calls the specified AI provider using key rotation and round-robin.
    If all keys of the chosen provider fail, automatically falls back to 
    other configured providers in order of priority.
    """
    provider = provider.lower()
    
    # Establish priority order for failovers
    providers_order = ["gemini", "openai", "groq", "deepseek", "openrouter"]
    if provider in providers_order:
        providers_order.remove(provider)
    providers_order.insert(0, provider)
    
    errors_summary = []
    
    for current_provider in providers_order:
        rotator = rotators.get(current_provider)
        if not rotator:
            continue
            
        rotator.load_keys()
        if not rotator.keys:
            # Skip if the provider has no keys configured
            continue
            
        attempts = len(rotator.keys)
        logger.info(f"Tentando provedor {current_provider.upper()} com {attempts} chave(s)...")
        
        for i in range(attempts):
            api_key = rotator.get_next_key()
            if not api_key:
                break
                
            try:
                logger.info(f"Chamando chave {i+1}/{attempts} do provedor {current_provider.upper()}...")
                
                if current_provider == "gemini":
                    return generate_with_gemini(api_key, prompt)
                elif current_provider == "openai":
                    return generate_with_openai_compatible(
                        api_key=api_key,
                        base_url="https://api.openai.com/v1",
                        model="gpt-4o-mini",
                        prompt=prompt
                    )
                elif current_provider == "groq":
                    return generate_with_openai_compatible(
                        api_key=api_key,
                        base_url="https://api.groq.com/openai/v1",
                        model="llama3-8b-8192",
                        prompt=prompt
                    )
                elif current_provider == "deepseek":
                    return generate_with_openai_compatible(
                        api_key=api_key,
                        base_url="https://api.deepseek.com/v1",
                        model="deepseek-chat",
                        prompt=prompt
                    )
                elif current_provider == "openrouter":
                    return generate_with_openai_compatible(
                        api_key=api_key,
                        base_url="https://openrouter.ai/api/v1",
                        model="meta-llama/llama-3-8b-instruct:free",
                        prompt=prompt
                    )
            except Exception as e:
                err_msg = f"{current_provider.upper()} (Chave {i+1}): {str(e)}"
                logger.warning(f"Falha na tentativa: {err_msg}")
                errors_summary.append(err_msg)
                # Continue loop to try next key in the active provider
                
    # If all configured keys and providers fail
    raise RuntimeError(
        f"Todos os provedores de IA falharam. "
        f"Erros encontrados: {'; '.join(errors_summary)}"
    )

def generate_personalized_message(lead, provider="gemini"):
    """
    Generates a personalized prospecting message for a lead.
    """
    nome = lead.get("nome", "Empresa")
    niche = lead.get("palavra_chave", "seu segmento")
    rating = lead.get("nota")
    reviews = lead.get("total_avaliacoes", 0)
    website = lead.get("website", "")
    endereco = lead.get("endereco", "")

    # Build prompt based on lead data
    prompt = f"""
    Analise os dados desta empresa e escreva uma "Primeira Mensagem de Abordagem" para enviar pelo WhatsApp.
    
    DADOS DA EMPRESA:
    - Nome: {nome}
    - Nicho/Busca: {niche}
    - Nota Google Maps: {rating if rating else 'Não informado'} (Total de avaliações: {reviews})
    - Website: {website if website else 'Não informado'}
    - Endereço: {endereco if endereco else 'Não informado'}
    
    REGRAS CRÍTICAS DA MENSAGEM:
    1. A mensagem deve ser EXCLUSIVA, amigável e direta ao ponto (não pareça spam corporativo ou robótico).
    2. Mencione de forma natural um ponto positivo (ex: 'vi que vocês têm uma excelente nota de {rating} no Google com {reviews} avaliações' ou 'visitei o site de vocês {website} e achei muito interessante').
    3. Apresente um gancho de valor amigável sugerindo que você pode ajudar a trazer mais clientes ou melhorar processos do nicho ({niche}).
    4. Termine com uma pergunta simples e aberta para iniciar uma conversa amigável (ex: 'Faz sentido para vocês?' ou 'Como está a captação de clientes de vocês essa semana?').
    5. Não use placeholders como [Seu Nome], use um tom no singular ou plural amigável, apenas escreva o corpo exato da mensagem pronta para ser enviada.
    6. Mantenha o tamanho ideal para leitura rápida no celular (máximo 4-5 parágrafos curtos, use emojis moderadamente).
    """
    
    return call_ai_with_rotation(prompt, provider)
