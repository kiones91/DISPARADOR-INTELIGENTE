import streamlit as st
import time
import base64
import random
import threading
from datetime import datetime

# Import modular backend
from backend import database as db
from backend import extractor
from backend import ai_handler
from backend.whatsapp_bot import bot_manager

# Set up clean page config
st.set_page_config(
    page_title="Disparador Inteligente - Prospecção I.A.",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom premium styling injection (Glassmorphism & Dark Aesthetics)
st.markdown("""
<style>
    /* Global Styles */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    
    html, body, [class*="css"] {
        font-family: 'Inter', sans-serif;
    }
    
    /* Sleek Cards */
    .metric-card {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        margin-bottom: 15px;
    }
    
    .metric-title {
        font-size: 0.85rem;
        color: #94a3b8;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 8px;
    }
    
    .metric-value {
        font-size: 2rem;
        font-weight: 800;
        color: #f8fafc;
        line-height: 1;
    }
    
    .metric-sub {
        font-size: 0.75rem;
        color: #10b981;
        font-weight: 600;
        margin-top: 6px;
    }
    
    /* Connection Widget */
    .connection-badge {
        padding: 6px 14px;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 600;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 20px;
    }
    
    .conn-connected {
        background-color: rgba(16, 185, 129, 0.15);
        color: #10b981;
        border: 1px solid rgba(16, 185, 129, 0.3);
    }
    
    .conn-waiting {
        background-color: rgba(245, 158, 11, 0.15);
        color: #f59e0b;
        border: 1px solid rgba(245, 158, 11, 0.3);
    }
    
    .conn-disconnected {
        background-color: rgba(148, 163, 184, 0.15);
        color: #94a3b8;
        border: 1px solid rgba(148, 163, 184, 0.3);
    }
</style>
""", unsafe_allow_html=True)

# Navigation Menu Sidebar
st.sidebar.markdown("### ⚡ MENU DE NAVEGAÇÃO")
menu_option = st.sidebar.radio(
    "Escolha uma tela:",
    [
        "📊 Dashboard Geral", 
        "📍 Extrator Google Maps", 
        "👥 Leads & Prospecção", 
        "✉️ Disparador WhatsApp", 
        "⚙️ Configurações APIs"
    ]
)

# Load data on refresh
leads = db.get_all_leads()

# Render status connection
conn_status = bot_manager.check_connection()

# Mapping states
connection_styles = {
    "connected": ("connected", "conn-connected", "WhatsApp Ativo"),
    "waiting_qr": ("waiting_qr", "conn-waiting", "Aguardando QR Code"),
    "authenticating": ("authenticating", "conn-waiting", "Autenticando..."),
    "disconnected": ("disconnected", "conn-disconnected", "Desconectado"),
    "error": ("error", "conn-disconnected", "Erro na API")
}

state_key, style_class, state_label = connection_styles.get(conn_status, ("disconnected", "conn-disconnected", "Desconectado"))

st.sidebar.markdown(f"""
<div class="connection-badge {style_class}">
    <span>●</span> {state_label}
</div>
""", unsafe_allow_html=True)

st.sidebar.markdown("---")
st.sidebar.markdown("<p style='font-size: 0.75rem; color:#64748b;'>Disparador Inteligente v2.0<br>Engenharia de Vendas Sênior</p>", unsafe_allow_html=True)

# Define callback triggers
def refresh_leads():
    st.cache_data.clear()

# ----------------- TELA: DASHBOARD GERAL -----------------
if menu_option == "📊 Dashboard Geral":
    st.title("Painel de Controle Geral")
    st.subheader("Métricas de prospecção em tempo real")
    
    total_leads = len(leads)
    analyzed_leads = len([l for l in leads if l.get("mensagem_personalizada")])
    sent_leads = len([l for l in leads if l.get("status_whatsapp") == "Enviado"])
    error_leads = len([l for l in leads if l.get("status_whatsapp") == "Erro"])
    
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-title">Total de Leads</div>
            <div class="metric-value">{total_leads}</div>
            <div class="metric-sub" style="color:#64748b;">empresas mineradas</div>
        </div>
        """, unsafe_allow_html=True)
        
    with col2:
        perc_ai = int((analyzed_leads / total_leads * 100)) if total_leads > 0 else 0
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-title">Abordagens Criadas</div>
            <div class="metric-value">{analyzed_leads}</div>
            <div class="metric-sub" style="color:#a855f7;">{perc_ai}% analisados com IA</div>
        </div>
        """, unsafe_allow_html=True)
        
    with col3:
        perc_sent = int((sent_leads / total_leads * 100)) if total_leads > 0 else 0
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-title">WhatsApp Enviados</div>
            <div class="metric-value">{sent_leads}</div>
            <div class="metric-sub" style="color:#10b981;">{perc_sent}% finalizados</div>
        </div>
        """, unsafe_allow_html=True)
        
    with col4:
        perc_err = int((error_leads / total_leads * 100)) if total_leads > 0 else 0
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-title">Falhas de Envio</div>
            <div class="metric-value">{error_leads}</div>
            <div class="metric-sub" style="color:#f43f5e;">{perc_err}% com erros</div>
        </div>
        """, unsafe_allow_html=True)
        
    # Active campaign display
    st.markdown("### Status da Fila de Transmissão")
    if bot_manager.campaign_active:
        st.info("🔥 Uma campanha de disparos está ativa em segundo plano!")
        
        c_lead = db.get_lead(bot_manager.current_lead_id) if bot_manager.current_lead_id else None
        c_name = c_lead["nome"] if c_lead else "Carregando..."
        
        # Details grid
        c1, c2, c3 = st.columns(3)
        c1.metric("Enviando para", c_name)
        c2.metric("Disparados", f"{bot_manager.leads_completed} / {bot_manager.leads_total}")
        
        if bot_manager.cooldown_active:
            c3.error(f"❄️ COOLDOWN ATIVO: {bot_manager.countdown_remaining // 60}m {bot_manager.countdown_remaining % 60}s")
        else:
            c3.warning(f"⏳ Próximo disparo em: {bot_manager.countdown_remaining}s")
            
        progress_val = (bot_manager.leads_completed + bot_manager.leads_failed) / bot_manager.leads_total
        st.progress(min(progress_val, 1.0))
        
        if st.button("Interromper Disparos", key="stop_dash"):
            bot_manager.stop_campaign()
            st.rerun()
    else:
        st.success("A fila de envios está vazia ou finalizada.")

# ----------------- TELA: EXTRATOR GOOGLE MAPS -----------------
elif menu_option == "📍 Extrator Google Maps":
    st.title("Extrator do Google Maps / Places")
    st.write("Digite as informações necessárias para varrer estabelecimentos locais.")
    
    col1, col2 = st.columns([1, 2])
    
    with col1:
        st.subheader("Configurações da Extração")
        keyword = st.text_input("Palavra-chave de Busca", placeholder="ex: Oficinas em São Paulo")
        radius = st.slider("Raio de Busca (metros)", 1000, 30000, 5000, 1000)
        
        # Search places
        if st.button("Extrair Contatos", use_container_width=True):
            if not keyword.strip():
                st.error("Por favor, preencha a palavra-chave.")
            else:
                with st.spinner("Buscando estabelecimentos..."):
                    new_leads = extractor.extract_leads(keyword, radius)
                    st.success(f"Sucesso! {len(new_leads)} novos contatos salvos.")
                    refresh_leads()
                    st.rerun()
                    
    with col2:
        st.subheader("Pré-visualização dos Leads Minerados")
        if total_leads := len(leads):
            # Render dataframe preview
            import pandas as pd
            df = pd.DataFrame(leads)
            preview_cols = ["nome", "telefone", "endereco", "website", "nota", "total_avaliacoes", "palavra_chave"]
            st.dataframe(df[preview_cols].head(15), use_container_width=True)
            st.caption(f"Mostrando as últimas 15 de {total_leads} empresas cadastradas no banco de dados.")
        else:
            st.info("Nenhum lead extraído no banco. Configure a busca ao lado para minerar contatos.")

# ----------------- TELA: LEADS & PROSPECÇÃO -----------------
elif menu_option == "👥 Leads & Prospecção":
    st.title("Base de Leads & Análise I.A.")
    st.write("Gere copys de vendas customizadas para cada empresa extraída utilizando inteligência artificial.")
    
    if not leads:
        st.info("Sua base de leads está vazia. Vá na aba 'Extrator Google Maps' para coletar empresas.")
    else:
        col_actions1, col_actions2 = st.columns([3, 1])
        
        with col_actions1:
            st.subheader("Ações em Lote")
            col_b1, col_b2 = st.columns(2)
            
            with col_b1:
                # Batch IA message completion
                if st.button("Analisar Perfil de Todos (Lote)", use_container_width=True):
                    unanalyzed = [l for l in leads if not l.get("mensagem_personalizada")]
                    if not unanalyzed:
                        st.info("Todos os leads da lista já possuem copys geradas.")
                    else:
                        st.info(f"Iniciando análise em lote para {len(unanalyzed)} leads em segundo plano...")
                        
                        def process_batch():
                            prov = db.get_setting("ai_provider", "gemini")
                            for l in unanalyzed:
                                try:
                                    msg = ai_handler.generate_personalized_message(l, provider=prov)
                                    db.update_lead(l["id"], {"mensagem_personalizada": msg})
                                except Exception as e:
                                    db.update_lead(l["id"], {"mensagem_personalizada": f"[Erro IA: {str(e)}]"})
                                    
                        t = threading.Thread(target=process_batch)
                        t.daemon = True
                        t.start()
                        st.rerun()
                        
            with col_b2:
                if st.button("Limpar Base de Leads (Excluir Tudo)", use_container_width=True):
                    if bot_manager.campaign_active:
                        st.error("Não é possível limpar a base com uma campanha de disparos ativa.")
                    else:
                        db.clear_leads()
                        st.success("Banco de dados limpo com sucesso!")
                        st.rerun()
                        
        with col_actions2:
            st.subheader("Filtros rápidos")
            search_query = st.text_input("Filtrar por nome/palavra-chave")
            
        # Render lists of leads
        for lead in leads:
            # Simple keyword match filter
            if search_query.strip() and search_query.lower() not in lead["nome"].lower() and search_query.lower() not in lead.get("palavra_chave", "").lower():
                continue
                
            lead_id = lead["id"]
            
            with st.container():
                st.markdown(f"#### 🏢 {lead['nome']}")
                
                c1, c2, c3 = st.columns([1, 2, 2])
                c1.write(f"📞 **Telefone:** {lead['telefone'] or 'Sem número'}")
                c1.write(f"⭐ **Nota:** {lead['nota'] or '0.0'} ({lead['total_avaliacoes'] or 0} avaliações)")
                
                c2.write(f"📍 **Endereço:** {lead['endereco']}")
                c2.write(f"🌐 **Website:** {lead['website'] or 'Sem site'}")
                
                # Copy area
                if lead.get("mensagem_personalizada"):
                    # Input area to edit message
                    edited_text = c3.text_area("Mensagem de abordagem:", lead["mensagem_personalizada"], key=f"txt_{lead_id}", height=110)
                    if edited_text != lead["mensagem_personalizada"]:
                        db.update_lead(lead_id, {"mensagem_personalizada": edited_text})
                else:
                    c3.warning("Nenhuma copy gerada para este lead.")
                    if c3.button("Analisar com IA", key=f"btn_ai_{lead_id}"):
                        with st.spinner("Analisando perfil..."):
                            try:
                                msg = ai_handler.generate_personalized_message(lead, provider=db.get_setting("ai_provider", "gemini"))
                                db.update_lead(lead_id, {"mensagem_personalizada": msg})
                                st.success("Mensagem criada!")
                                st.rerun()
                            except Exception as e:
                                st.error(f"Erro: {str(e)}")
                                
                # Footer actions
                c_foot1, c_foot2 = st.columns([5, 1])
                c_foot2.button("Excluir Lead", key=f"del_{lead_id}", on_click=db.delete_lead, args=(lead_id,))
                st.markdown("---")

# ----------------- TELA: DISPARADOR WHATSAPP -----------------
elif menu_option == "✉️ Disparador WhatsApp":
    st.title("Disparador WhatsApp Web")
    st.write("Monitore e execute as automações de disparos de mensagens.")
    
    col_conn, col_disp = st.columns([1, 2])
    
    with col_conn:
        st.subheader("Autenticação WhatsApp")
        
        if conn_status == "connected":
            st.success("✅ O WhatsApp está conectado e autenticado!")
            if st.button("Desconectar Instância", use_container_width=True):
                bot_manager.logout_instance()
                st.rerun()
        else:
            st.info("Escaneie o QR Code para conectar seu dispositivo.")
            if st.button("Gerar / Atualizar Conexão QR Code", use_container_width=True):
                bot_manager.check_connection()
                st.rerun()
                
            # Render QR Code Image if waiting_qr
            if bot_manager.qr_code_base64:
                qr_b64 = bot_manager.qr_code_base64
                if "base64," in qr_b64:
                    qr_bytes = base64.b64decode(qr_b64.split("base64,")[1])
                    st.image(qr_bytes, caption="Escaneie para conectar", width=250)
                else:
                    st.caption("Aguardando QR Code formatado do servidor Evolution...")
            else:
                st.write("Sem QR Code ativo. Clique no botão acima para instanciar.")
                
    with col_disp:
        st.subheader("Campanha de Envio em Lote")
        
        # Leads with messages to send
        ready_leads = [l for l in leads if l.get("mensagem_personalizada") and l.get("status_whatsapp") != "Enviado"]
        
        st.write(f"Você tem **{len(ready_leads)}** leads prontos para envio (possuem abordagem de IA e ainda não foram enviados).")
        
        if bot_manager.campaign_active:
            st.warning("🚨 Disparos em andamento!")
            
            # Live monitoring block
            monitor_box = st.empty()
            
            while bot_manager.campaign_active:
                lead_ref = db.get_lead(bot_manager.current_lead_id) if bot_manager.current_lead_id else None
                lead_name = lead_ref["nome"] if lead_ref else "Carregando..."
                
                with monitor_box.container():
                    st.write(f"Enviando para: **{lead_name}**")
                    st.write(f"Progresso: **{bot_manager.leads_completed} / {bot_manager.leads_total}**")
                    
                    if bot_manager.cooldown_active:
                        st.error(f"❄️ COOLDOWN ATIVO: Pausa anti-ban por {bot_manager.countdown_remaining // 60}m {bot_manager.countdown_remaining % 60}s")
                    else:
                        st.info(f"⏳ Intervalo anti-ban ativo: {bot_manager.countdown_remaining} segundos restantes")
                        
                time.sleep(1)
                
            st.rerun()
        else:
            # Buttons to start
            if st.button("Iniciar Disparos em Lote", disabled=(conn_status != "connected" or len(ready_leads) == 0), use_container_width=True):
                lead_ids = [l["id"] for l in ready_leads]
                bot_manager.start_campaign_thread(lead_ids)
                st.rerun()
                
            # Log listing
            st.markdown("#### Histórico Recente de Envios")
            sent_leads_list = [l for l in leads if l.get("status_whatsapp") in ["Enviado", "Erro"]]
            
            if sent_leads_list:
                for l in sent_leads_list[:10]:
                    status_emoji = "✅" if l["status_whatsapp"] == "Enviado" else "❌"
                    err_msg = f" ({l['detalhe_erro']})" if l['detalhe_erro'] else ""
                    st.write(f"{status_emoji} **{l['nome']}** - {l['status_whatsapp']}{err_msg}")
            else:
                st.caption("Nenhum envio realizado recentemente.")

# ----------------- TELA: CONFIGURAÇÕES APIS -----------------
elif menu_option == "⚙️ Configurações APIs":
    st.title("Aba Configurações de APIs")
    st.write("Defina as chaves de API necessárias para o funcionamento da prospecção e WhatsApp.")
    
    with st.form("settings_form"):
        st.subheader("1. Provedor de IA Ativo")
        active_provider = st.selectbox(
            "Selecione a Inteligência Artificial Ativa",
            ["gemini", "openai", "groq", "deepseek", "openrouter"],
            index=["gemini", "openai", "groq", "deepseek", "openrouter"].index(db.get_setting("ai_provider", "gemini"))
        )
        
        st.subheader("2. Chaves de API das IAs (Múltiplas chaves permitidas, separe por vírgula)")
        
        gemini_keys = st.text_input("Chaves Google Gemini", db.get_setting("gemini_keys", ""))
        openai_keys = st.text_input("Chaves OpenAI (sk-...)", db.get_setting("openai_keys", ""))
        groq_keys = st.text_input("Chaves Groq (gsk-...)", db.get_setting("groq_keys", ""))
        deepseek_keys = st.text_input("Chaves DeepSeek", db.get_setting("deepseek_keys", ""))
        openrouter_keys = st.text_input("Chaves OpenRouter", db.get_setting("openrouter_keys", ""))
        
        st.subheader("3. Configurações do Google Places")
        google_places_key = st.text_input("Chave Google Places API", db.get_setting("google_places_key", ""))
        st.caption("Se deixado em branco, o simulador de alta fidelidade minerará contatos de forma simulada sem custos.")
        
        st.subheader("4. Integração Evolution API (WhatsApp)")
        evolution_url = st.text_input("Evolution API URL (Endpoint base)", db.get_setting("evolution_api_url", "http://localhost:8080"))
        evolution_key = st.text_input("Evolution API Key (Global apikey)", db.get_setting("evolution_api_key", "global_api_key"))
        evolution_instance = st.text_input("Nome da Instância do WhatsApp", db.get_setting("evolution_instance_name", "prospecao"))
        
        if st.form_submit_button("Salvar Configurações"):
            db.set_setting("ai_provider", active_provider)
            db.set_setting("gemini_keys", gemini_keys)
            db.set_setting("openai_keys", openai_keys)
            db.set_setting("groq_keys", groq_keys)
            db.set_setting("deepseek_keys", deepseek_keys)
            db.set_setting("openrouter_keys", openrouter_keys)
            db.set_setting("google_places_key", google_places_key)
            db.set_setting("evolution_api_url", evolution_url)
            db.set_setting("evolution_api_key", evolution_key)
            db.set_setting("evolution_instance_name", evolution_instance)
            
            st.success("Configurações persistidas com sucesso!")
            time.sleep(1)
            st.rerun()
            
    # Direct Key Generation Help
    st.markdown("### 🔑 Obtenha suas Chaves de API")
    col_help1, col_help2, col_help3 = st.columns(3)
    col_help1.markdown("[Google Gemini AI Studio](https://aistudio.google.com/)")
    col_help2.markdown("[OpenAI API Console](https://platform.openai.com/)")
    col_help3.markdown("[Groq Cloud Console](https://console.groq.com/)")
