from fastapi import FastAPI, BackgroundTasks, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import threading
import logging

from backend import database as db
from backend.extractor import extract_leads
from backend.ai_handler import generate_personalized_message
from backend.whatsapp_bot import bot_manager

# Setup logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("API")

app = FastAPI(title="Disparador Inteligente API", version="1.0.0")

# Enable CORS for React frontend (Vite defaults to port 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For local development ease, allow all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Schemas
class SettingsUpdate(BaseModel):
    openai_keys: Optional[str] = None
    gemini_keys: Optional[str] = None
    groq_keys: Optional[str] = None
    deepseek_keys: Optional[str] = None
    openrouter_keys: Optional[str] = None
    google_places_key: Optional[str] = None
    ai_provider: Optional[str] = "gemini"

class ExtractionRequest(BaseModel):
    keyword: str
    radius: int = 5000

class LeadUpdate(BaseModel):
    nome: Optional[str] = None
    telefone: Optional[str] = None
    endereco: Optional[str] = None
    website: Optional[str] = None
    mensagem_personalizada: Optional[str] = None
    status_whatsapp: Optional[str] = None

class BatchAnalyzeRequest(BaseModel):
    lead_ids: List[int]
    provider: str = "gemini"

class CampaignStartRequest(BaseModel):
    lead_ids: List[int]

# Endpoints: Settings
@app.get("/api/settings")
def get_settings():
    return {
        "openai_keys": db.get_setting("openai_keys", ""),
        "gemini_keys": db.get_setting("gemini_keys", ""),
        "groq_keys": db.get_setting("groq_keys", ""),
        "deepseek_keys": db.get_setting("deepseek_keys", ""),
        "openrouter_keys": db.get_setting("openrouter_keys", ""),
        "google_places_key": db.get_setting("google_places_key", ""),
        "ai_provider": db.get_setting("ai_provider", "gemini"),
    }

@app.post("/api/settings")
def update_settings(settings: SettingsUpdate):
    if settings.openai_keys is not None:
        db.set_setting("openai_keys", settings.openai_keys)
    if settings.gemini_keys is not None:
        db.set_setting("gemini_keys", settings.gemini_keys)
    if settings.groq_keys is not None:
        db.set_setting("groq_keys", settings.groq_keys)
    if settings.deepseek_keys is not None:
        db.set_setting("deepseek_keys", settings.deepseek_keys)
    if settings.openrouter_keys is not None:
        db.set_setting("openrouter_keys", settings.openrouter_keys)
    if settings.google_places_key is not None:
        db.set_setting("google_places_key", settings.google_places_key)
    if settings.ai_provider is not None:
        db.set_setting("ai_provider", settings.ai_provider)
    return {"message": "Configurações atualizadas com sucesso!"}

# Endpoints: Leads
@app.get("/api/leads")
def list_leads(status: Optional[str] = None, keyword: Optional[str] = None):
    return db.get_all_leads(status=status, keyword=keyword)

@app.get("/api/leads/{lead_id}")
def get_lead(lead_id: int):
    lead = db.get_lead(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead não encontrado.")
    return lead

@app.put("/api/leads/{lead_id}")
def update_lead_endpoint(lead_id: int, lead_update: LeadUpdate):
    updates = {k: v for k, v in lead_update.dict().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="Nenhum campo para atualizar.")
    
    success = db.update_lead(lead_id, updates)
    if not success:
        raise HTTPException(status_code=404, detail="Lead não encontrado ou ativo na fila.")
    return {"message": "Lead atualizado com sucesso!"}

@app.delete("/api/leads/{lead_id}")
def delete_lead_endpoint(lead_id: int):
    success = db.delete_lead(lead_id)
    if not success:
        raise HTTPException(status_code=400, detail="Não é possível excluir um lead ativo em processamento.")
    return {"message": "Lead excluído com sucesso!"}

@app.delete("/api/leads")
def clear_all_leads():
    if bot_manager.campaign_active:
        raise HTTPException(status_code=400, detail="Não é possível limpar a base enquanto uma campanha de disparos está ativa.")
    db.clear_leads()
    return {"message": "Base de leads limpa com sucesso!"}

# Endpoints: Extraction
@app.post("/api/extract")
def extract_leads_endpoint(req: ExtractionRequest, background_tasks: BackgroundTasks):
    # Run extractor in background or sync depending on UI preference.
    # To give a quick response, we can fetch synchronously and return results, or trigger background task.
    # Since it might take 10-30s, running sync is fine for local setups, or we can use background task.
    # Let's do it sync here for instant table updates, but inside a try/catch.
    try:
        new_leads = extract_leads(req.keyword, req.radius)
        return {
            "message": f"Extração concluída! {len(new_leads)} leads adicionados.",
            "leads": new_leads
        }
    except Exception as e:
        logger.error(f"Erro na extração: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao extrair leads: {str(e)}")

# Endpoints: AI Engineering
@app.post("/api/leads/{lead_id}/analyze")
def analyze_lead(lead_id: int):
    lead = db.get_lead(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead não encontrado.")
    
    provider = db.get_setting("ai_provider", "gemini")
    
    try:
        msg = generate_personalized_message(lead, provider=provider)
        db.update_lead(lead_id, {"mensagem_personalizada": msg})
        return {
            "message": "Perfil analisado com sucesso!",
            "mensagem_personalizada": msg
        }
    except Exception as e:
        logger.error(f"Erro na análise de perfil: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

def process_batch_analysis(lead_ids, provider):
    """Worker for batch AI message generation."""
    for lead_id in lead_ids:
        lead = db.get_lead(lead_id)
        if not lead or lead.get("mensagem_personalizada"):
            continue
        try:
            msg = generate_personalized_message(lead, provider=provider)
            db.update_lead(lead_id, {"mensagem_personalizada": msg})
        except Exception as e:
            logger.error(f"Erro no batch para lead {lead_id}: {str(e)}")
            db.update_lead(lead_id, {
                "mensagem_personalizada": f"[Erro na geração da IA: {str(e)}]"
            })

@app.post("/api/leads/analyze_batch")
def analyze_leads_batch(req: BatchAnalyzeRequest, background_tasks: BackgroundTasks):
    # Run batch generation in a background thread to prevent API timeout
    background_tasks.add_task(process_batch_analysis, req.lead_ids, req.provider)
    return {"message": f"Análise em lote iniciada para {len(req.lead_ids)} leads em segundo plano."}

# Endpoints: WhatsApp Bot Controls
@app.post("/api/whatsapp/connect")
def whatsapp_connect(background_tasks: BackgroundTasks):
    # Launch browser window in background
    background_tasks.add_task(bot_manager.start_browser)
    return {"message": "Iniciando navegador WhatsApp Web. Uma janela será aberta em sua tela."}

@app.get("/api/whatsapp/status")
def whatsapp_status():
    status = bot_manager.check_connection()
    
    # Details of current campaign
    campaign_info = {
        "active": bot_manager.campaign_active,
        "current_lead_id": bot_manager.current_lead_id,
        "countdown_remaining": bot_manager.countdown_remaining,
        "total": bot_manager.leads_total,
        "completed": bot_manager.leads_completed,
        "failed": bot_manager.leads_failed,
    }
    
    # Get details of currently processing lead
    current_lead_name = ""
    if bot_manager.current_lead_id:
        curr_lead = db.get_lead(bot_manager.current_lead_id)
        if curr_lead:
            current_lead_name = curr_lead["nome"]
            
    campaign_info["current_lead_name"] = current_lead_name
    
    return {
        "connection": status,
        "campaign": campaign_info
    }

@app.post("/api/whatsapp/start")
def whatsapp_start_campaign(req: CampaignStartRequest):
    if not req.lead_ids:
        raise HTTPException(status_code=400, detail="Lista de IDs de leads vazia.")
    
    try:
        success = bot_manager.start_campaign_thread(req.lead_ids)
        if success:
            return {"message": "Campanha de disparos iniciada com sucesso!"}
        else:
            return {"message": "Campanha já está ativa."}
    except Exception as e:
        logger.error(f"Erro ao iniciar campanha: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/whatsapp/stop")
def whatsapp_stop_campaign():
    bot_manager.stop_campaign()
    return {"message": "Campanha de disparos interrompida."}

@app.post("/api/whatsapp/close")
def whatsapp_close_browser():
    bot_manager.close_browser()
    return {"message": "Navegador fechado com sucesso."}
