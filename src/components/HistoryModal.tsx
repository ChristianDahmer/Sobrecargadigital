import React, { useMemo } from 'react';
import { X, Calendar, Clock, Activity, Coins, TrendingDown, TrendingUp } from 'lucide-react';
import { GameSession } from '../utils/historyStorage';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: GameSession[];
}

export function HistoryModal({ isOpen, onClose, sessions }: HistoryModalProps) {
  if (!isOpen) return null;

  const chartData = useMemo(() => {
    return [...sessions]
      .reverse() // Oldest first for chart
      .map((session, index) => ({
        name: `Partida ${index + 1}`,
        Ansiedade: session.maxAnxiety,
        Moedas: session.coinsCollected,
        Tempo: session.timeSurvived,
      }));
  }, [sessions]);

  const bestTime = sessions.reduce((max, s) => Math.max(max, s.timeSurvived), 0);
  const totalCoinsEarned = sessions.reduce((sum, s) => sum + s.coinsCollected, 0);

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-800/50">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Histórico & Evolução</h2>
            <p className="text-sm text-slate-400 mt-1">Sua jornada de resiliência e controle de ansiedade.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-16 h-16 text-slate-700 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-300">Nenhum dado registrado</h3>
              <p className="text-slate-500 mt-2">Jogue sua primeira partida para gerar seu histórico de evolução.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Highlight Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700 flex items-center gap-4">
                  <div className="bg-indigo-500/20 p-3 rounded-xl text-indigo-400">
                    <Activity size={24} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total de Partidas</p>
                    <p className="text-2xl font-black text-white">{sessions.length}</p>
                  </div>
                </div>
                
                <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700 flex items-center gap-4">
                  <div className="bg-emerald-500/20 p-3 rounded-xl text-emerald-400">
                    <Clock size={24} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Melhor Tempo</p>
                    <p className="text-2xl font-black text-white">{bestTime}s</p>
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700 flex items-center gap-4">
                  <div className="bg-amber-500/20 p-3 rounded-xl text-amber-400">
                    <Coins size={24} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Moedas Acumuladas</p>
                    <p className="text-2xl font-black text-white">{totalCoinsEarned}</p>
                  </div>
                </div>
              </div>

              {/* Chart Section */}
              <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <TrendingDown className="text-emerald-400" />
                  Evolução do Estresse (Pico de Ansiedade)
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} unit="%" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc' }}
                        itemStyle={{ color: '#f8fafc' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="Ansiedade" 
                        stroke="#ef4444" 
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#0f172a' }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent Sessions List */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4">Últimas Partidas</h3>
                <div className="space-y-3">
                  {sessions.slice(0, 10).map((session, idx) => {
                    const isVictory = session.result === 'VITORIA';
                    return (
                      <div key={idx} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-full ${isVictory ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                            {isVictory ? <TrendingDown size={20} /> : <TrendingUp size={20} />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">
                                {isVictory ? 'Sobrevivência Bem-Sucedida' : 'Colapso Digital'}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                              <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(session.timestamp).toLocaleDateString('pt-BR')}</span>
                              <span className="flex items-center gap-1"><Clock size={12} /> {session.timeSurvived}s</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-6 items-center">
                          <div className="text-center">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Ansiedade</p>
                            <p className={`font-black ${session.maxAnxiety > 70 ? 'text-red-400' : session.maxAnxiety > 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {session.maxAnxiety}%
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Moedas</p>
                            <p className="font-black text-amber-400">+{session.coinsCollected}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
