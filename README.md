# ⚡ Disparador Inteligente - Automação de Vendas & Prospecção

Um software completo, modular e de altíssimo nível para **Automação de Vendas e Prospecção Inteligente**, integrando extração do Google Maps, enriquecimento de leads com Inteligência Artificial e disparos automáticos via WhatsApp Web com proteção anti-bloqueio.

## 🚀 Tecnologias Utilizadas
* **Back-end**: Python 3.11+ (FastAPI, SQLite, Playwright, Uvicorn)
* **Front-end**: React 19 (Vite, Tailwind CSS, Lucide Icons)
* **Inteligências Artificiais**: Google Gemini, OpenAI, Groq, DeepSeek, OpenRouter (com rotação automática de chaves e Round-Robin)

---

## 📂 Estrutura de Diretórios do Projeto
O projeto foi estruturado seguindo as melhores práticas de modularidade e desacoplamento:

```text
DISPARADOR INTELIGENTE/
├── backend/
│   ├── api.py               # Servidor FastAPI com rotas REST e endpoints do sistema
│   ├── database.py          # Gerenciador da conexão SQLite e CRUD do banco
│   ├── extractor.py         # Módulo de extração do Google Maps / Places API com Simulador
│   ├── ai_handler.py        # Módulo de IA com lógica de Rotação Round-Robin
│   ├── whatsapp_bot.py      # Automação de disparos via Playwright (delay anti-ban de 5 min)
│   └── whatsapp_session/    # Pasta criada dinamicamente para manter o WhatsApp Web logado
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx        # Cards de métricas gerais e progresso ativo
│   │   │   ├── Extractor.jsx        # Painel de busca e progresso de extração
│   │   │   ├── LeadTable.jsx        # Tabela com filtros de leads e edição de copies
│   │   │   ├── WhatsappSender.jsx   # QR Code, controle de envio e contador anti-ban
│   │   │   └── Settings.jsx         # Configurações de chaves e provedores
│   │   ├── App.jsx                  # Painel de controle, navegação e Dark/Light mode
│   │   ├── main.jsx                 # Inicialização do React
│   │   └── index.css                # Diretivas do Tailwind e estilos personalizados
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── index.html
├── prospecao.db                     # Banco de dados SQLite criado automaticamente
├── run.py                           # Script orquestrador de execução simultânea
├── requirements.txt                 # Dependências de bibliotecas Python
└── README.md                        # Este guia explicativo
```

---

## 🛠️ Banco de Dados (SQLite)
O banco de dados é criado automaticamente com duas tabelas principais na primeira execução:
1. **`leads`**: Registra dados extraídos do Google Maps (Nome, Telefone, Endereço, Website, Nota, Total de Avaliações, palavra-chave, a copy gerada pela IA, status de envio no WhatsApp e logs de erro).
2. **`settings`**: Armazena chaves de API (Gemini, OpenAI, Groq, DeepSeek, OpenRouter e Google Places) de forma persistente.

---

## 🎯 Principais Funcionalidades

### 1. Extrator do Google Maps (Google Places + Simulador)
* Se você cadastrar uma chave do Google Cloud (Google Places API Key) em Configurações, o sistema fará chamadas oficiais para buscar empresas.
* **Simulador de Alta Fidelidade (Free/Default)**: Se não houver chave cadastrada, o sistema ativa um simulador contextual avançado. Ele analisa sua palavra-chave (ex: "Oficinas em Curitiba") e gera empresas locais reais e contextualizadas com telefones no DDD correspondente (ex: DDD 41) para que você teste o fluxo inteiro gratuitamente.

### 2. Engenharia de IA com Rotação Round-Robin
* Suporta **Google Gemini**, **OpenAI (GPT-4o)**, **Groq (Llama 3)**, **DeepSeek** e **OpenRouter**.
* Você pode inserir **múltiplas chaves** separadas por vírgula no painel de configurações. O back-end rotaciona automaticamente a cada requisição e pula chaves que baterem no limite de requisições (`Rate Limit Exceeded`).
* O botão **Analisar Perfil** (individual ou em lote) faz uma varredura nas notas, avaliações e site do lead para redigir uma abordagem de WhatsApp única e persuasiva.

### 3. Disparador WhatsApp Web com Fila e Delay Anti-Ban
* Ao clicar em **Conectar WhatsApp Web**, o Playwright abre uma janela real do navegador Google Chrome.
* Escaneie o QR Code uma única vez. A sessão é gravada na pasta local `backend/whatsapp_session`, então você não precisará logar novamente.
* **Fila de Envio**: O robô lê os leads prontos linha a linha, digita e envia a mensagem de IA.
* **Regra Crítica de Delay**: Existe um intervalo obrigatório de **5 minutos** (300 segundos) entre os envios para evitar banimentos da plataforma. O front-end exibe um contador de contagem regressiva em tempo real.

---

## ⚙️ Instalação e Execução

### Passo 1: Pré-requisitos
Certifique-se de ter o **Python 3.11+** e o **Node.js** instalados em seu computador.

### Passo 2: Executar com um único comando
Toda a configuração de pacotes e instalação dos binários do Playwright já foi realizada pelo agente. Para rodar o servidor FastAPI (Back-end) e o Vite React (Front-end) simultaneamente, basta executar na raiz do projeto:

```bash
python run.py
```

Isso irá:
1. Subir o servidor FastAPI em `http://127.0.0.1:8000`
2. Subir o servidor Vite React em `http://localhost:5173`
3. Exibir o status no terminal e abrir o canal de logs.

Para encerrar o aplicativo, basta pressionar **Ctrl + C** no terminal, e o script se encarregará de matar todos os processos de forma limpa.
