import React, { useState, useEffect } from 'react';
import { LayoutDashboard, MapPin, Users, Send, Settings as SettingsIcon, Sun, Moon, Sparkles } from 'lucide-react';

import Dashboard from './components/Dashboard';
import Extractor from './components/Extractor';
import LeadTable from './components/LeadTable';
import WhatsappSender from './components/WhatsappSender';
import Settings from './components/Settings';

const BACKEND_URL = 'http://localhost:8000';

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [leads, setLeads] = useState([]);
  const [whatsappStatus, setWhatsappStatus] = useState(null);
  const [darkMode, setDarkMode] = useState(true); // default to a sleek dark mode

  // Load theme and initial state
  useEffect(() => {
    // Add/remove dark class based on state
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const fetchLeads = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/leads`);
      if (response.ok) {
        const data = await response.json();
        setLeads(data);
      }
    } catch (err) {
      console.error('Erro ao buscar leads:', err);
    }
  };

  const fetchWhatsappStatus = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/whatsapp/status`);
      if (response.ok) {
        const data = await response.json();
        setWhatsappStatus(data);
      }
    } catch (err) {
      console.error('Erro ao buscar status do WhatsApp:', err);
    }
  };

  // Poll API for updates on campaigns, connection and new extractions
  useEffect(() => {
    fetchLeads();
    fetchWhatsappStatus();

    const interval = setInterval(() => {
      fetchLeads();
      fetchWhatsappStatus();
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const handleExtractionComplete = () => {
    fetchLeads();
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'extractor', label: 'Extrator do Maps', icon: MapPin },
    { id: 'leads', label: 'Leads & Prospecção', icon: Users },
    { id: 'whatsapp', label: 'Disparador WhatsApp', icon: Send },
    { id: 'settings', label: 'Configurações APIs', icon: SettingsIcon },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between p-6">
        <div className="space-y-8">
          {/* Logo Brand */}
          <div className="flex items-center gap-2 px-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white font-extrabold shadow-md">
              D
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight leading-none text-slate-800 dark:text-slate-100 flex items-center gap-1">
                Disparador
                <span className="text-[9px] bg-brand-500/10 text-brand-600 px-1 py-0.5 rounded font-mono font-semibold">v1.0</span>
              </h1>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Prospecção Inteligente</p>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = tab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-500/10'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Sidebar (Theme toggle + User details) */}
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-850 transition"
          >
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
              {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              <span>{darkMode ? 'Modo Escuro' : 'Modo Claro'}</span>
            </span>
            <div className={`w-8 h-4 bg-slate-200 dark:bg-slate-800 rounded-full relative p-0.5 flex items-center ${darkMode ? 'justify-end bg-brand-600' : 'justify-start'}`}>
              <div className="w-3 h-3 bg-white dark:bg-slate-300 rounded-full shadow"></div>
            </div>
          </button>
          
          <div className="flex items-center gap-3 px-2">
            <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-xs uppercase text-slate-600 dark:text-slate-400">
              KB
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-none">Kiones B.</p>
              <p className="text-[10px] text-slate-400 mt-1">Engenheiro Sênior</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-8 overflow-y-auto max-w-6xl mx-auto">
        <div className="h-full">
          {tab === 'dashboard' && (
            <Dashboard leads={leads} whatsappStatus={whatsappStatus} setTab={setTab} />
          )}
          {tab === 'extractor' && (
            <Extractor onExtractionComplete={handleExtractionComplete} backendUrl={BACKEND_URL} />
          )}
          {tab === 'leads' && (
            <LeadTable leads={leads} onRefresh={fetchLeads} backendUrl={BACKEND_URL} />
          )}
          {tab === 'whatsapp' && (
            <WhatsappSender leads={leads} whatsappStatus={whatsappStatus} onRefresh={fetchLeads} backendUrl={BACKEND_URL} />
          )}
          {tab === 'settings' && (
            <Settings backendUrl={BACKEND_URL} onRefresh={fetchLeads} />
          )}
        </div>
      </main>
    </div>
  );
}
