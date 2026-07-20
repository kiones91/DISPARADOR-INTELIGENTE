import React, { useState } from 'react';
import { Play, Square, Chrome, Wifi, WifiOff, Loader2, Info, CheckCircle2, AlertCircle } from 'lucide-react';

export default function WhatsappSender({ leads, whatsappStatus, onRefresh, backendUrl }) {
  const [loadingAction, setLoadingAction] = useState(null);

  // Filter leads that have messages and are ready to be sent
  const readyLeads = leads.filter(l => l.mensagem_personalizada && l.status_whatsapp !== 'Enviado');
  const sentLeadsCount = leads.filter(l => l.status_whatsapp === 'Enviado').length;
  const failedLeadsCount = leads.filter(l => l.status_whatsapp === 'Erro').length;
  const processedLeads = leads.filter(l => l.mensagem_personalizada).length;

  const handleConnect = async () => {
    setLoadingAction('connect');
    try {
      const response = await fetch(`${backendUrl}/api/whatsapp/connect`, { method: 'POST' });
      if (!response.ok) throw new Error('Falha ao conectar navegador.');
      alert('Navegador WhatsApp Web sendo iniciado. Por favor, aguarde a janela abrir e escaneie o QR Code.');
    } catch (err) {
      alert(err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCloseBrowser = async () => {
    setLoadingAction('close');
    try {
      const response = await fetch(`${backendUrl}/api/whatsapp/close`, { method: 'POST' });
      if (!response.ok) throw new Error('Falha ao fechar navegador.');
      alert('Navegador fechado.');
    } catch (err) {
      alert(err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleStartCampaign = async () => {
    const readyIds = readyLeads.map(l => l.id);
    if (readyIds.length === 0) {
      alert('Não há leads pendentes com mensagem personalizada de IA.');
      return;
    }

    setLoadingAction('start');
    try {
      const response = await fetch(`${backendUrl}/api/whatsapp/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_ids: readyIds })
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Falha ao iniciar campanha.');
      }
      onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleStopCampaign = async () => {
    setLoadingAction('stop');
    try {
      const response = await fetch(`${backendUrl}/api/whatsapp/stop`, { method: 'POST' });
      if (!response.ok) throw new Error('Falha ao interromper campanha.');
      onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const connectionDetails = {
    disconnected: { label: 'Desconectado', color: 'text-slate-500 bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800' },
    waiting_qr: { label: 'Aguardando Escanear QR Code', color: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/40' },
    authenticating: { label: 'Carregando WhatsApp Web...', color: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/40 animate-pulse' },
    connected: { label: 'Conectado e Pronto para Disparar', color: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/40' },
    error: { label: 'Erro de Conexão', color: 'text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/40' }
  };

  const conn = whatsappStatus?.connection || 'disconnected';
  const currentDetails = connectionDetails[conn];

  const campaignActive = whatsappStatus?.campaign?.active || false;
  const currentLeadName = whatsappStatus?.campaign?.current_lead_name || '';
  const countdown = whatsappStatus?.campaign?.countdown_remaining || 0;
  
  const totalInCampaign = whatsappStatus?.campaign?.total || 0;
  const completedInCampaign = whatsappStatus?.campaign?.completed || 0;
  const failedInCampaign = whatsappStatus?.campaign?.failed || 0;
  const progressInCampaign = completedInCampaign + failedInCampaign;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Disparador WhatsApp Web</h2>
        <p className="text-slate-500 dark:text-slate-400">
          Conecte seu WhatsApp e envie mensagens personalizadas de forma 100% automatizada.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Panel 1: Connection & Instruction */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-semibold text-lg">Conexão do Dispositivo</h3>
          
          {/* Connection badge status */}
          <div className={`p-4 border rounded-xl flex items-center gap-3 text-sm font-medium ${currentDetails.color}`}>
            {conn === 'connected' ? (
              <Wifi className="h-5 w-5" />
            ) : (
              <WifiOff className="h-5 w-5" />
            )}
            <div>
              <p className="text-xs text-slate-400 font-normal">Status do WhatsApp</p>
              <p className="font-semibold">{currentDetails.label}</p>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleConnect}
              disabled={loadingAction !== null || conn === 'connected' || conn === 'waiting_qr' || conn === 'authenticating'}
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow transition flex items-center justify-center gap-2"
            >
              {loadingAction === 'connect' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Chrome className="h-4 w-4" />
              )}
              <span>Conectar WhatsApp Web</span>
            </button>
            
            {(conn === 'connected' || conn === 'waiting_qr' || conn === 'authenticating') && (
              <button
                onClick={handleCloseBrowser}
                disabled={loadingAction !== null}
                className="w-full py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-sm font-semibold text-rose-500 hover:text-rose-600 transition"
              >
                {loadingAction === 'close' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span>Fechar Navegador</span>
                )}
              </button>
            )}
          </div>

          {/* Quick Help box */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 rounded-xl text-xs space-y-2 text-slate-500 dark:text-slate-400 leading-relaxed">
            <div className="flex items-center gap-1 text-slate-800 dark:text-slate-200 font-semibold">
              <Info className="h-3.5 w-3.5" />
              <span>Como funciona?</span>
            </div>
            <p>1. Clique em <strong>Conectar WhatsApp Web</strong>. Uma janela do Chrome dedicada irá abrir em sua tela.</p>
            <p>2. Escaneie o QR Code usando o leitor do seu aplicativo de WhatsApp no celular.</p>
            <p>3. Quando o status mudar para <strong>Conectado</strong>, retorne aqui e inicie os disparos automáticos.</p>
            <p className="text-amber-600 dark:text-amber-400 font-medium">⚠️ Não feche a janela do navegador que abrir enquanto os disparos estiverem acontecendo!</p>
          </div>
        </div>

        {/* Panel 2 & 3: Campaign Dispatcher */}
        <div className="md:col-span-2 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-semibold text-lg">Controle da Fila de Disparos</h3>
            <span className="text-xs text-slate-400 font-semibold uppercase">
              {readyLeads.length} pendentes / {processedLeads} prontos com IA
            </span>
          </div>

          {/* Campaign status metrics if running */}
          {campaignActive ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl text-center">
                <span className="text-xs text-slate-400 block">Progresso</span>
                <span className="text-xl font-bold">{progressInCampaign} de {totalInCampaign}</span>
              </div>
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-950 rounded-xl text-center text-emerald-700 dark:text-emerald-300">
                <span className="text-xs text-slate-400 block">Enviados</span>
                <span className="text-xl font-bold flex items-center justify-center gap-1">
                  <CheckCircle2 className="h-4.5 w-4.5" />
                  {completedInCampaign}
                </span>
              </div>
              <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-950 rounded-xl text-center text-rose-700 dark:text-rose-300">
                <span className="text-xs text-slate-400 block">Falhas</span>
                <span className="text-xl font-bold flex items-center justify-center gap-1">
                  <AlertCircle className="h-4.5 w-4.5" />
                  {failedInCampaign}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl flex justify-between items-center text-sm">
              <span className="text-slate-500 dark:text-slate-400">Leads prontos para envio (com IA):</span>
              <span className="text-lg font-bold text-brand-600 dark:text-brand-400">{readyLeads.length} leads</span>
            </div>
          )}

          {/* Progress bar if campaign active */}
          {campaignActive && (
            <div className="space-y-2">
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-500" 
                  style={{ width: `${Math.round((progressInCampaign / totalInCampaign) * 100) || 0}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Iniciada</span>
                <span>{Math.round((progressInCampaign / totalInCampaign) * 100) || 0}% Concluído</span>
              </div>
            </div>
          )}

          {/* Action triggers */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {!campaignActive ? (
              <button
                onClick={handleStartCampaign}
                disabled={conn !== 'connected' || readyLeads.length === 0 || loadingAction !== null}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-md transition flex items-center justify-center gap-2"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Iniciar Disparos em Lote</span>
              </button>
            ) : (
              <button
                onClick={handleStopCampaign}
                disabled={loadingAction !== null}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-md transition flex items-center justify-center gap-2"
              >
                <Square className="h-4 w-4 fill-current" />
                <span>Interromper Disparos</span>
              </button>
            )}
          </div>

          {/* Campaign details & countdown visual */}
          {campaignActive && (
            <div className="border border-slate-100 dark:border-slate-800 p-6 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-50 dark:border-slate-850 pb-3 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Disparando no momento para:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{currentLeadName || '...'}</span>
                </div>
                
                <span className="px-2 py-0.5 rounded text-xs bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold uppercase animate-pulse">
                  Processando
                </span>
              </div>

              {countdown > 0 ? (
                <div className="flex flex-col items-center justify-center py-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850">
                  <span className="text-xs text-slate-400 uppercase font-semibold">Esperando intervalo anti-ban (regra de 5 minutos)</span>
                  <span className="text-4xl font-extrabold tracking-tight text-brand-600 dark:text-brand-400 mt-2 font-mono">
                    {Math.floor(countdown / 60).toString().padStart(2, '0')}:{(countdown % 60).toString().padStart(2, '0')}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-2">
                    Próximo lead será processado assim que o contador chegar a 00:00.
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-2">
                  <Loader2 className="h-6 w-6 text-brand-500 animate-spin" />
                  <span className="text-xs text-slate-400 font-semibold">Enviando mensagem via WhatsApp Web...</span>
                </div>
              )}
            </div>
          )}

          {/* Quick Stats table preview */}
          {!campaignActive && (
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl p-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Histórico de Disparos Recentes</h4>
              <div className="grid grid-cols-2 gap-4 text-sm font-semibold">
                <div className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Contatos Enviados:</span>
                  <span className="text-emerald-500">{sentLeadsCount}</span>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Erros Registrados:</span>
                  <span className="text-rose-500">{failedLeadsCount}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
