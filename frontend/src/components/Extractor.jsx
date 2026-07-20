import React, { useState } from 'react';
import { Search, MapPin, Loader2, Sparkles, Check } from 'lucide-react';

export default function Extractor({ onExtractionComplete, backendUrl }) {
  const [keyword, setKeyword] = useState('');
  const [radius, setRadius] = useState(5000);
  const [loading, setLoading] = useState(false);
  const [extractedLeads, setExtractedLeads] = useState(null);
  const [error, setError] = useState(null);

  const handleExtract = async (e) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    setLoading(true);
    setError(null);
    setExtractedLeads(null);

    try {
      const response = await fetch(`${backendUrl}/api/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, radius: parseInt(radius) })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Falha ao extrair contatos.');
      }

      const data = await response.json();
      setExtractedLeads(data.leads);
      if (onExtractionComplete) {
        onExtractionComplete(data.leads);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Extrator do Google Maps</h2>
        <p className="text-slate-500 dark:text-slate-400">
          Pesquise empresas por palavra-chave e localização para extrair contatos prontos para abordagem.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Search Panel Card */}
        <div className="md:col-span-1 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4 h-fit">
          <h3 className="font-semibold text-lg">Parâmetros de Busca</h3>
          
          <form onSubmit={handleExtract} className="space-y-4">
            {/* Keyword Field */}
            <div className="space-y-2">
              <label htmlFor="keyword" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Palavra-chave
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  id="keyword"
                  type="text"
                  placeholder="ex: Oficinas em São Paulo"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                  required
                />
              </div>
            </div>

            {/* Radius Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
                <span>Raio de Busca</span>
                <span className="text-brand-500 font-bold">{radius / 1000} km</span>
              </div>
              <input
                type="range"
                min="1000"
                max="30000"
                step="1000"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                disabled={loading}
                className="w-full accent-brand-500 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>1 km</span>
                <span>30 km</span>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading || !keyword.trim()}
              className="w-full py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Extraindo...</span>
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4" />
                  <span>Extrair Contatos</span>
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 rounded-xl text-xs">
              <strong>Erro:</strong> {error}
            </div>
          )}
        </div>

        {/* Results Panel */}
        <div className="md:col-span-2 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-semibold text-lg">Resultados da Última Extração</h3>
            {extractedLeads && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full font-medium">
                <Check className="h-3 w-3" />
                {extractedLeads.length} novos leads
              </span>
            )}
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <Loader2 className="h-10 w-10 text-brand-500 animate-spin" />
              <p className="text-sm font-medium text-slate-500">Varrendo o Google Maps...</p>
              <p className="text-xs text-slate-400 text-center max-w-xs">
                Isso pode levar alguns segundos enquanto organizamos os telefones e avaliações.
              </p>
            </div>
          )}

          {!loading && !extractedLeads && (
            <div className="text-center py-20 text-slate-400 dark:text-slate-600">
              <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Os leads extraídos aparecerão aqui.</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Digite um nicho e região ao lado (Ex: "Petshops em Pinheiros, São Paulo") e clique para extrair contatos locais instantaneamente.
              </p>
            </div>
          )}

          {!loading && extractedLeads && extractedLeads.length === 0 && (
            <div className="text-center py-20 text-slate-400 dark:text-slate-600">
              <p className="text-sm font-medium">Nenhum lead encontrado.</p>
              <p className="text-xs text-slate-400 mt-1">
                Tente uma palavra-chave diferente ou aumente o raio de busca.
              </p>
            </div>
          )}

          {!loading && extractedLeads && extractedLeads.length > 0 && (
            <div className="overflow-x-auto max-h-[400px]">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/40 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 font-semibold rounded-l-xl">Empresa</th>
                    <th className="px-4 py-3 font-semibold">Telefone</th>
                    <th className="px-4 py-3 font-semibold">Nota / Avaliações</th>
                    <th className="px-4 py-3 font-semibold rounded-r-xl">Website</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {extractedLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="px-4 py-3 font-semibold">
                        <div>
                          <p>{lead.nome}</p>
                          <p className="text-[10px] text-slate-400 font-normal line-clamp-1">{lead.endereco}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-medium">
                        {lead.telefone || <span className="text-xs text-rose-500 font-normal">Sem Telefone</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-amber-500 font-bold">★ {lead.nota || '0.0'}</span>
                          <span className="text-xs text-slate-400">({lead.total_avaliacoes || 0})</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-indigo-500 hover:underline">
                        {lead.website ? (
                          <a href={lead.website} target="_blank" rel="noopener noreferrer" className="line-clamp-1 max-w-[120px]">
                            {lead.website.replace('https://', '').replace('www.', '')}
                          </a>
                        ) : (
                          <span className="text-slate-400 font-normal">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
