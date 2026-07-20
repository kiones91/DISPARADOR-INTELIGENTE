import time
import threading
import logging
import random
import requests
import os
import re
from datetime import datetime
from backend.database import get_lead, update_lead, get_setting

logger = logging.getLogger("WhatsAppBot")

def get_evolution_config():
    """Fetches the Evolution API configuration from settings database or environment variables."""
    url = get_setting("evolution_api_url", os.getenv("EVOLUTION_API_URL", "http://localhost:8080"))
    key = get_setting("evolution_api_key", os.getenv("EVOLUTION_API_KEY", "global_api_key"))
    instance = get_setting("evolution_instance_name", os.getenv("EVOLUTION_INSTANCE_NAME", "prospecao"))
    return url.rstrip("/"), key, instance

class EvolutionCampaignManager:
    def __init__(self):
        self.campaign_thread = None
        self.is_running = False
        
        # State variables for frontend monitoring
        self.campaign_active = False
        self.current_lead_id = None
        self.countdown_remaining = 0
        self.cooldown_active = False
        self.leads_total = 0
        self.leads_completed = 0
        self.leads_failed = 0
        self.qr_code_base64 = None
        
        # Lock for thread safety
        self.lock = threading.Lock()

    def create_instance(self):
        """Creates the WhatsApp instance in Evolution API if it doesn't exist."""
        url, key, instance = get_evolution_config()
        headers = {"apikey": key, "Content-Type": "application/json"}
        
        # Payload to create instance
        payload = {
            "instanceName": instance,
            "token": "",
            "number": "",
            "integration": "WHATSAPP-BAILEYS",
            "reject_call": False,
            "msg_call": "",
            "groups_ignore": true,
            "always_online": true,
            "read_messages": true,
            "read_status": false,
            "sync_full_history": false
        }
        
        try:
            # Let's clean the payload boolean mapping for JSON
            import json
            payload_str = json.dumps(payload).replace("true", "true").replace("false", "false")
            
            logger.info(f"Attempting to create instance '{instance}' on Evolution API...")
            response = requests.post(f"{url}/instance/create", headers=headers, json=payload, timeout=10)
            
            if response.status_code in [200, 201]:
                logger.info(f"Instance '{instance}' created successfully.")
                return True
            else:
                logger.warning(f"Failed to create instance. Status: {response.status_code}, Body: {response.text}")
                return False
        except Exception as e:
            logger.error(f"Error creating Evolution instance: {str(e)}")
            return False

    def get_qr_code(self):
        """Fetches the connection QR code from Evolution API."""
        url, key, instance = get_evolution_config()
        headers = {"apikey": key}
        
        try:
            response = requests.get(f"{url}/instance/connect/{instance}", headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                # Evolution API v2 returns { "code": "...", "base64": "data:image/png;base64,..." }
                if isinstance(data, dict):
                    self.qr_code_base64 = data.get("base64") or data.get("code")
                else:
                    self.qr_code_base64 = None
                return self.qr_code_base64
            return None
        except Exception as e:
            logger.error(f"Error fetching QR code: {str(e)}")
            return None

    def check_connection(self):
        """Checks connection status of the instance. Auto-creates it if missing (404/400)."""
        url, key, instance = get_evolution_config()
        headers = {"apikey": key}
        
        try:
            response = requests.get(f"{url}/instance/connectionState/{instance}", headers=headers, timeout=5)
            
            if response.status_code in [404, 400] or "not found" in response.text.lower():
                # Instance doesn't exist, create it
                self.create_instance()
                self.get_qr_code()
                return "waiting_qr"
                
            if response.status_code == 200:
                data = response.json()
                # Parse connection state
                # Expected structure: { "instance": { "state": "open" | "close" | "connecting" } }
                state = data.get("instance", {}).get("state")
                
                if state == "open":
                    self.qr_code_base64 = None
                    return "connected"
                elif state in ["close", "connecting"]:
                    # Fetch fresh QR code
                    self.get_qr_code()
                    return "waiting_qr"
                else:
                    return "authenticating"
                    
            return "disconnected"
        except Exception as e:
            logger.error(f"Error checking Evolution connection: {str(e)}")
            return "disconnected"

    def logout_instance(self):
        """Logs out and deletes the instance from Evolution API."""
        url, key, instance = get_evolution_config()
        headers = {"apikey": key}
        
        try:
            logger.info(f"Logging out instance '{instance}'...")
            requests.post(f"{url}/instance/logout/{instance}", headers=headers, timeout=10)
            logger.info(f"Deleting instance '{instance}'...")
            requests.delete(f"{url}/instance/delete/{instance}", headers=headers, timeout=10)
            self.qr_code_base64 = None
            return True
        except Exception as e:
            logger.error(f"Error logging out instance: {str(e)}")
            return False

    def clean_phone_number(self, phone):
        """Formats phone number for the WhatsApp network (numbers only)."""
        if not phone:
            return ""
        nums = re.sub(r'[^0-9]', '', phone)
        # Brazil phone formatting checks
        if len(nums) <= 11 and len(nums) >= 10:
            nums = f"55{nums}"
        return nums

    def simulate_typing(self, phone):
        """Simulates typing presence (composing status) on WhatsApp for a random time (5 to 8s)."""
        url, key, instance = get_evolution_config()
        headers = {"apikey": key, "Content-Type": "application/json"}
        clean_phone = self.clean_phone_number(phone)
        
        payload = {
            "number": clean_phone,
            "presence": "composing"
        }
        
        try:
            logger.info(f"Simulating composing presence (typing...) for {clean_phone}")
            requests.post(f"{url}/chat/sendPresence/{instance}", headers=headers, json=payload, timeout=5)
        except Exception as e:
            logger.warning(f"Failed to set composing status: {str(e)}")
            
        # Hold the thread for 5 to 8 random seconds to simulate typing
        typing_duration = random.randint(5, 8)
        time.sleep(typing_duration)

    def send_whatsapp_message(self, phone, message):
        """Sends a text message using the Evolution API."""
        url, key, instance = get_evolution_config()
        headers = {"apikey": key, "Content-Type": "application/json"}
        clean_phone = self.clean_phone_number(phone)
        
        if not clean_phone:
            raise ValueError("Número de telefone inválido.")

        # Simulate human typing first! (Rule B)
        self.simulate_typing(phone)

        payload = {
            "number": clean_phone,
            "text": message,
            "linkPreview": True
        }
        
        logger.info(f"Sending Evolution message to: {clean_phone}")
        response = requests.post(f"{url}/message/sendText/{instance}", headers=headers, json=payload, timeout=15)
        
        if response.status_code not in [200, 201]:
            raise RuntimeError(f"Evolution API returned error status {response.status_code}: {response.text}")
            
        logger.info("Message successfully dispatched by Evolution API.")

    def run_campaign(self, lead_ids):
        """Worker function running in a background thread to send messages with randomized delays and strategic cooldown breaks."""
        self.campaign_active = True
        self.leads_total = len(lead_ids)
        self.leads_completed = 0
        self.leads_failed = 0
        self.cooldown_active = False
        
        logger.info(f"[CAMPANHA] Iniciando campanha Evolution API para {self.leads_total} leads.")
        
        # Batch count to trigger strategic cooldowns
        leads_in_batch = 0
        
        for idx, lead_id in enumerate(lead_ids):
            if not self.campaign_active:
                logger.info("[CAMPANHA] Interrompida pelo usuário.")
                break
                
            self.current_lead_id = lead_id
            lead = get_lead(lead_id)
            
            if not lead:
                self.leads_failed += 1
                continue
                
            if not lead.get("mensagem_personalizada"):
                update_lead(lead_id, {
                    "status_whatsapp": "Erro",
                    "detalhe_erro": "Falta mensagem de IA."
                })
                self.leads_failed += 1
                continue
                
            update_lead(lead_id, {"status_whatsapp": "Processando"})
            
            try:
                # 1. Send the message (this handles composing presence simulation internally)
                self.send_whatsapp_message(lead["telefone"], lead["mensagem_personalizada"])
                
                # Update DB
                update_lead(lead_id, {
                    "status_whatsapp": "Enviado",
                    "data_envio": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "detalhe_erro": None
                })
                self.leads_completed += 1
                leads_in_batch += 1
                
            except Exception as e:
                logger.error(f"[CAMPANHA] Erro ao enviar lead {lead_id}: {str(e)}")
                update_lead(lead_id, {
                    "status_whatsapp": "Erro",
                    "detalhe_erro": str(e)
                })
                self.leads_failed += 1
                
            # If this is not the last lead and campaign is still active, process intervals & cooldowns
            if idx < len(lead_ids) - 1 and self.campaign_active:
                
                # Rule D: Strategic Resting Cooldown
                # Every 10 to 15 random messages, take a longer resting break
                cooldown_trigger_limit = random.choice([10, 11, 12, 13, 14, 15])
                if leads_in_batch >= cooldown_trigger_limit:
                    # Strategic cooldown: 5 to 10 minutes (300 to 600 seconds)
                    cooldown_duration = random.randint(300, 600)
                    logger.info(f"[CAMPANHA COOLDOWN] Parada estratégica anti-ban. Descansando número por {cooldown_duration}s...")
                    
                    self.cooldown_active = True
                    self.countdown_remaining = cooldown_duration
                    leads_in_batch = 0 # reset batch count
                    
                    while self.countdown_remaining > 0 and self.campaign_active:
                        time.sleep(1)
                        self.countdown_remaining -= 1
                        
                    self.cooldown_active = False
                    
                # Rule A: Randomized Dynamic Delay between standard messages
                # Random delay between 60 and 150 seconds
                else:
                    # Let's read if test override is active (for fast debugging/validation)
                    delay_override = os.getenv("WHATSAPP_TEST_DELAY")
                    delay_duration = int(delay_override) if delay_override else random.randint(60, 150)
                    
                    logger.info(f"[CAMPANHA DELAY] Esperando {delay_duration}s (delay dinâmico)...")
                    self.countdown_remaining = delay_duration
                    while self.countdown_remaining > 0 and self.campaign_active:
                        time.sleep(1)
                        self.countdown_remaining -= 1
                        
        # Campaign ended
        self.campaign_active = False
        self.current_lead_id = None
        self.countdown_remaining = 0
        self.cooldown_active = False
        logger.info("[CAMPANHA] Finalizada.")

    def start_campaign_thread(self, lead_ids):
        """Launches the background thread processing the campaign queue."""
        if self.campaign_active:
            return False
            
        connection_status = self.check_connection()
        if connection_status != "connected":
            raise RuntimeError("A Evolution API precisa estar conectada ao WhatsApp antes de disparar.")
            
        self.campaign_thread = threading.Thread(target=self.run_campaign, args=(lead_ids,))
        self.campaign_thread.daemon = True
        self.campaign_thread.start()
        return True

    def stop_campaign(self):
        """Stops the campaign processing loop."""
        self.campaign_active = False
        self.countdown_remaining = 0
        self.cooldown_active = False
        logger.info("[CAMPANHA] Solicitada interrupção.")

# Global instance of bot
bot_manager = EvolutionCampaignManager()
