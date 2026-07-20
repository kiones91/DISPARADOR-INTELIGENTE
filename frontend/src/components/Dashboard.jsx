import React from 'react';
import { Users, Brain, Send, AlertTriangle, CheckCircle, Wifi, WifiOff } from 'lucide-react';

export default function Dashboard({ leads, whatsappStatus, setTab }) {
  const totalLeads = leads.length;
  const analyzedLeads = leads.filter(l => l.mensagem_personalizada).length;
  const pendingLeads = leads.filter(l => !l.mensagem_personalizada).length;
  const sentLeads = leads.filter(l => l.status_whatsapp === 'Enviado').length;
  const errorLeads = leads.filter(l => l.status_whatsapp === 'Erro').length;
  const idleLeads = leads.filter(l => l.status_whatsapp === 'Pendente').length;

  const connectionColors = {
    connected: 'bg-emerald-500 text-white',
    waiting_qr: 'bg-amber-500 text-white',
    authenticating: 'bg-blue-500 text-white',
    disconnected: 'bg-slate-500 text-white',
    error: 'bg-rose-500 text-white'
  };

  const connectionText = {
    connected: 'WhatsApp Conectado',
    waiting_qr: 'Aguardando QR Code',
    authenticating: 'Autenticando...',
    disconnected: 'Desconectado',
    error: 'Erro na Conexão'
  };

  const getStatusPercent = (count) => {
    if (totalLeads === 0) return 0;
    return Math.round((count / totalLeads) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard de Prospecção</h2>
          <p className="text-slate-500 dark:text-slate-400">
            Acompanhe o progresso de extração de leads, inteligência e disparos ativos.
          </p>
        </div>
        
        {/* Connection Widget */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm shadow-sm ${connectionColors[whatsappStatus?.connection] || 'bg-slate-500 text-white'}`}>
          {whatsappStatus?.connection === 'connected' ? (
            <Wifi className="h-4 w-4 animate-pulse" />
          ) : (
            <WifiOff className="h-4 w-4" />
          )}
          <span>{connectionText[whatsappStatus?.connection] || 'Verificando...'}</span>
        </div>
      </div>

      {/* Grid Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Leads */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total de Leads</span>
            <Users className="h-5 w-5 text-brand-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold tracking-tight">{totalLeads}</span>
            <span className="text-xs text-slate-400">empresas salvas</span>
          </div>
        </div>

        {/* AI Analyzed */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Mensagens Geradas</span>
            <Brain className="h-5 w-5 text-purple-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold tracking-tight">{analyzedLeads}</span>
            <span className="text-xs text-emerald-600 font-semibold">{getStatusPercent(analyzedLeads)}% da base</span>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500" style={{ width: `${getStatusPercent(analyzedLeads)}%` }}></div>
          </div>
        </div>

        {/* WhatsApp Sent */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 font-semibold">Envios Concluídos</span>
            <CheckCircle className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold tracking-tight">{sentLeads}</span>
            <span className="text-xs text-emerald-600 font-semibold">{getStatusPercent(sentLeads)}% disparados</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: `${getStatusPercent(sentLeads)}%` }}></div>
          </div>
        </div>

        {/* WhatsApp Error */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Falhas de Envio</span>
            <AlertTriangle className="h-5 w-5 text-rose-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold tracking-tight text-rose-600 dark:text-rose-400">{errorLeads}</span>
            <span className="text-xs text-rose-600 font-semibold">{getStatusPercent(errorLeads)}% de erro</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-rose-500" style={{ width: `${getStatusPercent(errorLeads)}%` }}></div>
          </div>
        </div>
      </div>

      {/* Main Panel Content */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Campaign Info */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-semibold text-lg">Campanha em Execução</h3>
          {whatsappStatus?.campaign?.active ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 rounded-xl text-sm border border-emerald-100 dark:border-emerald-900/35">
                <p className="font-medium animate-pulse">Disparador de WhatsApp Ativo</p>
                <p className="text-xs mt-1">Enviando para: <span className="font-semibold">{whatsappStatus.campaign.current_lead_name || '...'}</span></p>
              </div>
              <div className="flex justify-between text-sm">
                <span>Progresso Total:</span>
                <span className="font-semibold">{whatsappStatus.campaign.completed + whatsappStatus.campaign.failed} de {whatsappStatus.campaign.total} leads</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-500" 
                  style={{ width: `${Math.round(((whatsappStatus.campaign.completed + whatsappStatus.campaign.failed) / whatsappStatus.campaign.total) * 100)}%` }}
                ></div>
              </div>
              {whatsappStatus.campaign.countdown_remaining > 0 && (
                <div className="text-center py-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">Intervalo anti-bloqueio</span>
                  <span className="text-2xl font-bold tracking-tight text-brand-600 dark:text-brand-400">
                    {Math.floor(whatsappStatus.campaign.countdown_remaining / 60)}m {whatsappStatus.campaign.countdown_remaining % 60}s
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 dark:text-slate-600">
              <Send className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum envio ativo no momento.</p>
              <button 
                onClick={() => setTab('whatsapp')}
                className="mt-4 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
              >
                Ir para o Disparador
              </button>
            </div>
          )}
        </div>

        {/* Quick Actions / Integration Status */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-semibold text-lg font-semibold">Status de Automação</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 text-sm">
              <span className="font-medium">1. Extrair Empresas</span>
              <span className={`px-2 py-0.5 rounded text-xs ${totalLeads > 0 ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'}`}>
                {totalLeads > 0 ? `${totalLeads} Leads` : 'Vazio'}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 text-sm">
              <span className="font-medium font-semibold">2. Enriquecimento de IA</span>
              <span className={`px-2 py-0.5 rounded text-xs ${analyzedLeads === totalLeads && totalLeads > 0 ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'}`}>
                {analyzedLeads} de {totalLeads}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 text-sm">
              <span className="font-medium">3. Disparador WhatsApp</span>
              <span className={`px-2 py-0.5 rounded text-xs ${whatsappStatus?.connection === 'connected' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                {whatsappStatus?.connection === 'connected' ? 'Pronto' : 'Inativo'}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => setTab('extractor')}
              className="w-full py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white rounded-xl text-sm font-semibold shadow transition"
            >
              Iniciar Nova Prospecção
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
