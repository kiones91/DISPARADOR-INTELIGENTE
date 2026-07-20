import React, { useState } from 'react';
import { Brain, Trash2, Edit2, Loader2, Sparkles, X, Check, Search, Filter } from 'lucide-react';

export default function LeadTable({ leads, onRefresh, backendUrl }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loadingLeadId, setLoadingLeadId] = useState(null);
  const [batchAnalyzing, setBatchAnalyzing] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [editedMsg, setEditedMsg] = useState('');
  const [viewingLeadMsg, setViewingLeadMsg] = useState(null);

  // Filter leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          lead.palavra_chave?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          lead.telefone?.includes(searchTerm);
                          
    const matchesStatus = statusFilter === '' || lead.status_whatsapp === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleAnalyzeLead = async (leadId) => {
    setLoadingLeadId(leadId);
    try {
      const response = await fetch(`${backendUrl}/api/leads/${leadId}/analyze`, {
        method: 'POST'
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Falha ao analisar lead.');
      }
      onRefresh();
    } catch (err) {
      alert(`Erro na análise: ${err.message}`);
    } finally {
      setLoadingLeadId(null);
    }
  };

  const handleAnalyzeBatch = async () => {
    const unanalyzedIds = leads
      .filter(l => !l.mensagem_personalizada)
      .map(l => l.id);
      
    if (unanalyzedIds.length === 0) {
      alert('Todos os leads já possuem mensagem de IA.');
      return;
    }

    setBatchAnalyzing(true);
    try {
      const response = await fetch(`${backendUrl}/api/leads/analyze_batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_ids: unanalyzedIds })
      });
      if (!response.ok) {
        throw new Error('Erro ao iniciar processamento em lote.');
      }
      alert('Análise em lote iniciada! As mensagens serão geradas em segundo plano.');
      onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setBatchAnalyzing(false);
    }
  };

  const handleDeleteLead = async (leadId) => {
    if (!confirm('Deseja realmente excluir este lead?')) return;
    try {
      const response = await fetch(`${backendUrl}/api/leads/${leadId}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Não foi possível excluir.');
      }
      onRefresh();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('ATENÇÃO: Deseja realmente excluir TODOS os leads do banco de dados? Esta ação não pode ser desfeita.')) return;
    try {
      const response = await fetch(`${backendUrl}/api/leads`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error('Falha ao limpar base.');
      }
      onRefresh();
    } catch (err) {
      alert(err.message);
    }
  };

  const startEditMsg = (lead) => {
    setEditingLead(lead);
    setEditedMsg(lead.mensagem_personalizada || '');
  };

  const saveEditedMsg = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/leads/${editingLead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensagem_personalizada: editedMsg })
      });
      if (!response.ok) {
        throw new Error('Falha ao salvar edição.');
      }
      setEditingLead(null);
      onRefresh();
    } catch (err) {
      alert(err.message);
    }
  };

  const statusBadges = {
    Pendente: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    Processando: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 animate-pulse',
    Enviado: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    Erro: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Base de Leads Extraídos</h2>
          <p className="text-slate-500 dark:text-slate-400">
            Gerencie contatos, gere abordagens exclusivas por IA e prepare o disparo de WhatsApp.
          </p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={handleAnalyzeBatch}
            disabled={batchAnalyzing || leads.length === 0}
            className="flex-1 sm:flex-initial px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow transition flex items-center justify-center gap-2"
          >
            {batchAnalyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Brain className="h-4 w-4" />
            )}
            <span>Analisar Todos</span>
          </button>
          
          <button
            onClick={handleClearAll}
            disabled={leads.length === 0}
            className="px-4 py-2 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden md:inline">Limpar Base</span>
          </button>
        </div>
      </div>

      {/* Filters Card */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm grid gap-4 sm:grid-cols-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, nicho..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition appearance-none cursor-pointer"
          >
            <option value="">Todos os Status de Envio</option>
            <option value="Pendente">Pendente</option>
            <option value="Processando">Processando</option>
            <option value="Enviado">Enviado</option>
            <option value="Erro">Erro com Falha</option>
          </select>
        </div>

        {/* Count display */}
        <div className="flex items-center justify-end text-xs text-slate-400 font-semibold uppercase pr-2">
          Exibindo {filteredLeads.length} de {leads.length} leads
        </div>
      </div>

      {/* Leads Table Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {filteredLeads.length === 0 ? (
          <div className="text-center py-20 text-slate-400 dark:text-slate-600">
            <p className="text-sm font-semibold">Nenhum lead encontrado com estes filtros.</p>
            <p className="text-xs text-slate-400 mt-1">Extraia novos contatos na aba do Extrator ou limpe seus termos de filtro.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-850">
                <tr>
                  <th className="px-6 py-4 font-semibold">Nome / Endereço</th>
                  <th className="px-6 py-4 font-semibold">Telefone</th>
                  <th className="px-6 py-4 font-semibold">Copy de Abordagem IA</th>
                  <th className="px-6 py-4 font-semibold">Status Envio</th>
                  <th className="px-6 py-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10">
                    {/* Name */}
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold">{lead.nome}</p>
                        <div className="flex gap-2 items-center text-[10px] mt-0.5 text-slate-400">
                          <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-semibold">
                            {lead.palavra_chave || 'Geral'}
                          </span>
                          <span className="truncate max-w-[200px]">{lead.endereco}</span>
                        </div>
                      </div>
                    </td>
                    
                    {/* Phone */}
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">
                      {lead.telefone || <span className="text-xs text-rose-500 font-normal">Sem Telefone</span>}
                    </td>

                    {/* Copy Column */}
                    <td className="px-6 py-4 max-w-[280px]">
                      {lead.mensagem_personalizada ? (
                        <div className="space-y-1.5">
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 italic">
                            "{lead.mensagem_personalizada}"
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setViewingLeadMsg(lead.mensagem_personalizada)}
                              className="text-[10px] font-bold text-brand-600 hover:underline"
                            >
                              Ver completa
                            </button>
                            <button
                              onClick={() => startEditMsg(lead)}
                              className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-0.5"
                            >
                              <Edit2 className="h-2.5 w-2.5" /> Editar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAnalyzeLead(lead.id)}
                          disabled={loadingLeadId === lead.id}
                          className="px-3 py-1 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/30 dark:hover:bg-purple-900/30 disabled:opacity-50 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                        >
                          {loadingLeadId === lead.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Brain className="h-3.5 w-3.5" />
                          )}
                          <span>Gerar Mensagem</span>
                        </button>
                      )}
                    </td>

                    {/* Status Whatsapp */}
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBadges[lead.status_whatsapp] || statusBadges.Pendente}`}>
                        {lead.status_whatsapp}
                      </span>
                      {lead.detalhe_erro && (
                        <p className="text-[10px] text-rose-500 mt-1 line-clamp-1 max-w-[150px]" title={lead.detalhe_erro}>
                          {lead.detalhe_erro}
                        </p>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteLead(lead.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 transition"
                        title="Excluir Lead"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* VIEW MESSAGE DIALOG MODAL */}
      {viewingLeadMsg && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative space-y-4">
            <button 
              onClick={() => setViewingLeadMsg(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-850"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="font-bold text-lg">Mensagem de Abordagem Personalizada</h3>
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 text-sm whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-300 select-all">
              {viewingLeadMsg}
            </div>
            <p className="text-xs text-slate-400">
              Dica: Você pode copiar o texto clicando acima ou selecionando-o.
            </p>
          </div>
        </div>
      )}

      {/* EDIT MESSAGE DIALOG MODAL */}
      {editingLead && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 relative">
            <button 
              onClick={() => setEditingLead(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-850"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="font-bold text-lg">Editar Mensagem para {editingLead.nome}</h3>
            
            <textarea
              rows="8"
              value={editedMsg}
              onChange={(e) => setEditedMsg(e.target.value)}
              className="w-full p-4 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition leading-relaxed text-slate-700 dark:text-slate-300"
            />
            
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setEditingLead(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-sm font-semibold transition"
              >
                Cancelar
              </button>
              <button
                onClick={saveEditedMsg}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold shadow transition"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
