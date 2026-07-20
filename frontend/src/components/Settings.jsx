import React, { useState, useEffect } from 'react';
import { Save, Key, ExternalLink, Loader2, Sparkles, AlertCircle } from 'lucide-react';

export default function Settings({ backendUrl, onRefresh }) {
  const [formData, setFormData] = useState({
    gemini_keys: '',
    openai_keys: '',
    groq_keys: '',
    deepseek_keys: '',
    openrouter_keys: '',
    google_places_key: '',
    ai_provider: 'gemini'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/settings`);
      if (response.ok) {
        const data = await response.json();
        setFormData(data);
      }
    } catch (err) {
      console.error('Erro ao buscar configurações:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`${backendUrl}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setMessage({ type: 'success', text: data.message });
        if (onRefresh) onRefresh();
      } else {
        throw new Error('Falha ao salvar configurações.');
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Configurações do Sistema</h2>
        <p className="text-slate-500 dark:text-slate-400">
          Gerencie chaves de API, configure a rotação automática e defina os provedores de inteligência artificial.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Settings Form */}
        <form onSubmit={handleSave} className="md:col-span-2 space-y-6">
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Key className="h-5 w-5 text-brand-500" />
              Chaves de API das IAs & Rotação
            </h3>
            
            <p className="text-xs text-slate-400 leading-relaxed border-l-2 border-brand-500 pl-3">
              💡 <strong>Regra de Rotação (Round-Robin):</strong> Você pode cadastrar várias chaves de API para cada provedor separando-as por vírgula (ex: <code>chave1, chave2, chave3</code>). O sistema rotacionará as chaves a cada requisição ou fará o fallback automático em caso de limite atingido (Rate Limit).
            </p>

            <div className="space-y-4 pt-2">
              {/* Active Provider */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Provedor de IA Ativo para Prospecção
                </label>
                <select
                  name="ai_provider"
                  value={formData.ai_provider}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition cursor-pointer"
                >
                  <option value="gemini">Google Gemini (Padrão/Livre)</option>
                  <option value="openai">OpenAI (GPT-4o-mini)</option>
                  <option value="groq">Groq (Llama 3 Ultra-Rápido)</option>
                  <option value="deepseek">DeepSeek Chat (Ultra-Econômico)</option>
                  <option value="openrouter">OpenRouter (Múltiplas IAs)</option>
                </select>
              </div>

              {/* Gemini Keys */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Chaves Google Gemini
                  </label>
                  <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-[10px] text-brand-600 hover:underline flex items-center gap-0.5">
                    Pegar chave <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>
                <input
                  type="text"
                  name="gemini_keys"
                  value={formData.gemini_keys}
                  onChange={handleChange}
                  placeholder="chave1, chave2, chave3..."
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                />
              </div>

              {/* OpenAI Keys */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Chaves OpenAI
                  </label>
                  <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-[10px] text-brand-600 hover:underline flex items-center gap-0.5">
                    Pegar chave <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>
                <input
                  type="text"
                  name="openai_keys"
                  value={formData.openai_keys}
                  onChange={handleChange}
                  placeholder="sk-..., sk-..."
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                />
              </div>

              {/* Groq Keys */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Chaves Groq (Llama 3)
                  </label>
                  <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-[10px] text-brand-600 hover:underline flex items-center gap-0.5">
                    Pegar chave <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>
                <input
                  type="text"
                  name="groq_keys"
                  value={formData.groq_keys}
                  onChange={handleChange}
                  placeholder="gsk-..., gsk-..."
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                />
              </div>

              {/* DeepSeek Keys */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Chaves DeepSeek
                  </label>
                  <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener noreferrer" className="text-[10px] text-brand-600 hover:underline flex items-center gap-0.5">
                    Pegar chave <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>
                <input
                  type="text"
                  name="deepseek_keys"
                  value={formData.deepseek_keys}
                  onChange={handleChange}
                  placeholder="sk-..., sk-..."
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                />
              </div>

              {/* OpenRouter Keys */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Chaves OpenRouter
                  </label>
                  <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-[10px] text-brand-600 hover:underline flex items-center gap-0.5">
                    Pegar chave <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>
                <input
                  type="text"
                  name="openrouter_keys"
                  value={formData.openrouter_keys}
                  onChange={handleChange}
                  placeholder="sk-or-..., sk-or-..."
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Google Places Settings */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <MapPinIcon className="h-5 w-5 text-indigo-500" />
              Configuração do Google Maps
            </h3>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Google Places API Key
                </label>
                <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-600 hover:underline flex items-center gap-0.5">
                  Google Cloud Console <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>
              <input
                type="text"
                name="google_places_key"
                value={formData.google_places_key}
                onChange={handleChange}
                placeholder="AIzaSy..."
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              />
              <p className="text-[10px] text-slate-400">
                Se este campo estiver em branco, o sistema usará automaticamente o <strong>simulador de alta fidelidade</strong> para extrações locais rápidas e livres de custo.
              </p>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            {message && (
              <div className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300' : 'bg-rose-50 text-rose-800 dark:bg-rose-950/20 dark:text-rose-300'}`}>
                <AlertCircle className="h-4 w-4" />
                <span>{message.text}</span>
              </div>
            )}
            
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow transition flex items-center gap-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>Salvar Configurações</span>
            </button>
          </div>
        </form>

        {/* Informative Side Card */}
        <div className="space-y-4">
          <div className="p-6 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4 leading-relaxed">
            <h4 className="font-semibold text-base">Consoles de Chaves</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Precisa gerar chaves para outros provedores? Acesse os consoles oficiais:
            </p>
            
            <div className="space-y-2 text-xs">
              <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-brand-500 transition">
                <span className="font-semibold text-slate-700 dark:text-slate-300">1. Google AI Studio</span>
                <span className="text-[10px] text-brand-600 flex items-center gap-0.5">Visitar <ExternalLink className="h-2.5 w-2.5" /></span>
              </a>
              <a href="https://platform.openai.com/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-brand-500 transition">
                <span className="font-semibold text-slate-700 dark:text-slate-300">2. OpenAI Platform</span>
                <span className="text-[10px] text-brand-600 flex items-center gap-0.5">Visitar <ExternalLink className="h-2.5 w-2.5" /></span>
              </a>
              <a href="https://console.groq.com/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-brand-500 transition">
                <span className="font-semibold text-slate-700 dark:text-slate-300">3. Groq Console</span>
                <span className="text-[10px] text-brand-600 flex items-center gap-0.5">Visitar <ExternalLink className="h-2.5 w-2.5" /></span>
              </a>
              <a href="https://openrouter.ai/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-brand-500 transition">
                <span className="font-semibold text-slate-700 dark:text-slate-300">4. OpenRouter Console</span>
                <span className="text-[10px] text-brand-600 flex items-center gap-0.5">Visitar <ExternalLink className="h-2.5 w-2.5" /></span>
              </a>
              <a href="https://platform.deepseek.com/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-brand-500 transition">
                <span className="font-semibold text-slate-700 dark:text-slate-300">5. DeepSeek Platform</span>
                <span className="text-[10px] text-brand-600 flex items-center gap-0.5">Visitar <ExternalLink className="h-2.5 w-2.5" /></span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple local wrapper since MapPin name collides
function MapPinIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
