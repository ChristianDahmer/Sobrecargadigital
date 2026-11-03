import React, { useState } from 'react';
import { X, Zap, Shield, Magnet, Brain, Coins, Check, Activity, Award, Sparkles, Trophy, Coffee, HeartPulse, Wind } from 'lucide-react';
import { PlayerSkills } from '../types';
import { addTotalCoinsLocal, savePlayerSkillsLocal } from '../utils/historyStorage';
import { useLanguage } from '../i18n/LanguageContext';

interface SkillShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerSkills: PlayerSkills;
  onSkillsUpdate: (newSkills: PlayerSkills) => void;
  coins: number;
  onCoinsUpdate: (newCoins: number) => void;
}

export function SkillShopModal({ isOpen, onClose, playerSkills, onSkillsUpdate, coins, onCoinsUpdate }: SkillShopModalProps) {
  if (!isOpen) return null;

  const { t, language } = useLanguage();
  const [purchaseFeedback, setPurchaseFeedback] = useState<string | null>(null);

  const SKILL_COSTS = {
    doubleJump: 25,
    shield: 15,
    magnet: 20,
    resilience: 30, // per level (max 2)
    betterShoes: 30,
    hoodie: 40,
    cap: 20,
    soccerKit: 35,
    calmingTea: 30,
    breathingBand: 40,
  };

  const formatCurrency = (val: number) => {
    const localeMap = { pt: 'pt-BR', es: 'es-ES', en: 'en-US', de: 'de-DE' };
    const currencyMap = { pt: 'BRL', es: 'EUR', en: 'USD', de: 'EUR' };
    return val.toLocaleString(localeMap[language] || 'pt-BR', { style: 'currency', currency: currencyMap[language] || 'BRL' });
  };

  const handleColorChange = (type: 'hoodieColor' | 'capColor', colorHex: string) => {
    const newSkills = { ...playerSkills, [type]: colorHex };
    savePlayerSkillsLocal(newSkills);
    onSkillsUpdate(newSkills);
    setPurchaseFeedback(`Cor Atualizada!`);
    setTimeout(() => setPurchaseFeedback(null), 1500);
  };

  const handlePurchase = (skillId: keyof PlayerSkills) => {
    let cost = (SKILL_COSTS as any)[skillId] || 50;
    
    if (skillId === 'resilience') {
      if (playerSkills.resilience >= 2) return;
      cost = playerSkills.resilience === 0 ? 30 : 60;
    } else {
      if (playerSkills[skillId]) return; // Already maxed
    }

    const currentTotalCoins = coins;
    if (currentTotalCoins >= cost) {
      // Deduct coins safely
      const newTotal = addTotalCoinsLocal(-cost);
      onCoinsUpdate(newTotal);

      // Upgrade skill
      const newSkills = { ...playerSkills };
      if (skillId === 'resilience') {
        newSkills.resilience += 1;
      } else {
        (newSkills as any)[skillId] = true;
      }

      savePlayerSkillsLocal(newSkills);
      onSkillsUpdate(newSkills);

      setPurchaseFeedback(`Melhoria Adquirida!`);
      setTimeout(() => setPurchaseFeedback(null), 2000);
    } else {
      setPurchaseFeedback(`Saldo Insuficiente!`);
      setTimeout(() => setPurchaseFeedback(null), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-amber-500/30 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl shadow-amber-500/10 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-800/50">
          <div>
            <h2 className="text-2xl font-black text-amber-400 uppercase tracking-tight flex items-center gap-2">
              <Zap className="fill-amber-400" /> Loja de Habilidades & Acessórios
            </h2>
            <p className="text-sm text-slate-400 mt-1">Invista suas moedas para fortalecer sua jornada e personalização.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-slate-950 rounded-xl px-4 py-2 border border-amber-500/20 flex items-center gap-2">
              <Coins className="text-amber-400" size={20} />
              <span className="text-amber-400 font-mono font-black text-lg sm:text-xl">
                {formatCurrency(coins)}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {purchaseFeedback && (
          <div className={`text-center py-2 text-sm font-bold uppercase tracking-widest ${purchaseFeedback.includes('Adquirida') || purchaseFeedback.includes('Atualizada') ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
            {purchaseFeedback}
          </div>
        )}

        {/* Skills Grid */}
        <div className="p-6 overflow-y-auto max-h-[70vh] bg-slate-950/50 grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Double Jump */}
          <div className={`p-5 rounded-2xl border ${playerSkills.doubleJump ? 'bg-indigo-900/20 border-indigo-500/50' : 'bg-slate-800/80 border-slate-700'} flex flex-col justify-between`}>
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className={`p-3 rounded-xl ${playerSkills.doubleJump ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-700 text-slate-400'}`}>
                  <Zap size={28} />
                </div>
                {playerSkills.doubleJump && <div className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Check size={14}/> ADQUIRIDO</div>}
              </div>
              <h3 className="text-lg font-black text-white uppercase">Pulo Duplo</h3>
              <p className="text-sm text-slate-400 mt-2">Permite um segundo salto no ar para transpor grandes grupos de notificações ou abismos digitais.</p>
            </div>
            
            {!playerSkills.doubleJump && (
              <button 
                onClick={() => handlePurchase('doubleJump')}
                className={`mt-6 w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${coins >= SKILL_COSTS.doubleJump ? 'bg-amber-500 hover:bg-amber-400 text-amber-950 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
              >
                <Coins size={18} /> {formatCurrency(SKILL_COSTS.doubleJump)}
              </button>
            )}
          </div>

          {/* Shield */}
          <div className={`p-5 rounded-2xl border ${playerSkills.shield ? 'bg-cyan-900/20 border-cyan-500/50' : 'bg-slate-800/80 border-slate-700'} flex flex-col justify-between`}>
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className={`p-3 rounded-xl ${playerSkills.shield ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-700 text-slate-400'}`}>
                  <Shield size={28} />
                </div>
                {playerSkills.shield && <div className="bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Check size={14}/> ADQUIRIDO</div>}
              </div>
              <h3 className="text-lg font-black text-white uppercase">Escudo Protetor Inicial</h3>
              <p className="text-sm text-slate-400 mt-2">Comece cada sessão com um escudo de bolha que absorve o primeiro impacto de notificação tóxica.</p>
            </div>
            
            {!playerSkills.shield && (
              <button 
                onClick={() => handlePurchase('shield')}
                className={`mt-6 w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${coins >= SKILL_COSTS.shield ? 'bg-amber-500 hover:bg-amber-400 text-amber-950 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
              >
                <Coins size={18} /> {formatCurrency(SKILL_COSTS.shield)}
              </button>
            )}
          </div>

          {/* Magnet */}
          <div className={`p-5 rounded-2xl border ${playerSkills.magnet ? 'bg-emerald-900/20 border-emerald-500/50' : 'bg-slate-800/80 border-slate-700'} flex flex-col justify-between`}>
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className={`p-3 rounded-xl ${playerSkills.magnet ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                  <Magnet size={28} />
                </div>
                {playerSkills.magnet && <div className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Check size={14}/> ADQUIRIDO</div>}
              </div>
              <h3 className="text-lg font-black text-white uppercase">Ímã de Moedas & Bem-Estar</h3>
              <p className="text-sm text-slate-400 mt-2">Atrai automaticamente itens benéficos e moedas douradas que caírem perto do seu avatar.</p>
            </div>
            
            {!playerSkills.magnet && (
              <button 
                onClick={() => handlePurchase('magnet')}
                className={`mt-6 w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${coins >= SKILL_COSTS.magnet ? 'bg-amber-500 hover:bg-amber-400 text-amber-950 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
              >
                <Coins size={18} /> {formatCurrency(SKILL_COSTS.magnet)}
              </button>
            )}
          </div>

          {/* Resilience (Levels 1 and 2) */}
          <div className={`p-5 rounded-2xl border ${playerSkills.resilience >= 2 ? 'bg-purple-900/20 border-purple-500/50' : 'bg-slate-800/80 border-slate-700'} flex flex-col justify-between`}>
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className={`p-3 rounded-xl ${playerSkills.resilience > 0 ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-700 text-slate-400'}`}>
                  <Brain size={28} />
                </div>
                <div className="flex gap-1">
                  <div className={`w-3 h-3 rounded-full ${playerSkills.resilience >= 1 ? 'bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.5)]' : 'bg-slate-700'}`} />
                  <div className={`w-3 h-3 rounded-full ${playerSkills.resilience >= 2 ? 'bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.5)]' : 'bg-slate-700'}`} />
                </div>
              </div>
              <h3 className="text-lg font-black text-white uppercase">Resiliência Mental (Nível {playerSkills.resilience}/2)</h3>
              <p className="text-sm text-slate-400 mt-2">Reduz o dano de ansiedade recebido ao ignorar ou errar uma notificação urgente (-15% por nível).</p>
            </div>
            
            {playerSkills.resilience < 2 ? (
              <button 
                onClick={() => handlePurchase('resilience')}
                className={`mt-6 w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${coins >= (playerSkills.resilience === 0 ? 30 : 60) ? 'bg-amber-500 hover:bg-amber-400 text-amber-950 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
              >
                <Coins size={18} /> {formatCurrency(playerSkills.resilience === 0 ? 30 : 60)} (Nível {playerSkills.resilience + 1})
              </button>
            ) : (
              <div className="mt-6 w-full py-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-300 font-bold text-center text-sm flex items-center justify-center gap-1">
                <Check size={16} /> NÍVEL MÁXIMO
              </div>
            )}
          </div>

          {/* Shoes (Running Shoes) */}
          <div className={`p-5 rounded-2xl border ${playerSkills.betterShoes ? 'bg-amber-900/20 border-amber-500/50' : 'bg-slate-800/80 border-slate-700'} flex flex-col justify-between`}>
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className={`p-3 rounded-xl ${playerSkills.betterShoes ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-400'}`}>
                  <Activity size={28} />
                </div>
                {playerSkills.betterShoes && <div className="bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Check size={14}/> ADQUIRIDO</div>}
              </div>
              <h3 className="text-lg font-black text-white uppercase">Tênis de Corrida Leve</h3>
              <p className="text-sm text-slate-400 mt-2">Aumenta a velocidade de movimento do avatar em +25%, permitindo esquivar mais facilmente de sobrecargas.</p>
            </div>
            
            {!playerSkills.betterShoes && (
              <button 
                onClick={() => handlePurchase('betterShoes')}
                className={`mt-6 w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${coins >= SKILL_COSTS.betterShoes ? 'bg-amber-500 hover:bg-amber-400 text-amber-950 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
              >
                <Coins size={18} /> {formatCurrency(SKILL_COSTS.betterShoes)}
              </button>
            )}
          </div>

          {/* Hoodie Customization */}
          <div className={`p-5 rounded-2xl border ${playerSkills.hoodie ? 'bg-rose-900/20 border-rose-500/50' : 'bg-slate-800/80 border-slate-700'} flex flex-col justify-between`}>
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className={`p-3 rounded-xl ${playerSkills.hoodie ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-700 text-slate-400'}`}>
                  <Award size={28} />
                </div>
                {playerSkills.hoodie && <div className="bg-rose-500/20 text-rose-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Check size={14}/> ADQUIRIDO</div>}
              </div>
              <h3 className="text-lg font-black text-white uppercase">Moletom com Capuz</h3>
              <p className="text-sm text-slate-400 mt-2">Roupa personalizada para o avatar com cores customizáveis em tempo real no visual 3D.</p>

              {playerSkills.hoodie && (
                <div className="mt-4 pt-3 border-t border-slate-800">
                  <p className="text-xs font-bold text-slate-300 mb-2">ESCOLHER COR DO MOLETOM:</p>
                  <div className="flex gap-2">
                    {[
                      { name: 'Roxo Cyber', hex: '#8b5cf6' },
                      { name: 'Azul Elétrico', hex: '#0ea5e9' },
                      { name: 'Verde Neon', hex: '#10b981' },
                      { name: 'Laranja Radiante', hex: '#f97316' },
                      { name: 'Preto Grafite', hex: '#1e293b' },
                    ].map((c) => (
                      <button
                        key={c.hex}
                        onClick={() => handleColorChange('hoodieColor', c.hex)}
                        className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${playerSkills.hoodieColor === c.hex ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-70 hover:opacity-100'}`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {!playerSkills.hoodie && (
              <button 
                onClick={() => handlePurchase('hoodie')}
                className={`mt-6 w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${coins >= SKILL_COSTS.hoodie ? 'bg-amber-500 hover:bg-amber-400 text-amber-950 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
              >
                <Coins size={18} /> {formatCurrency(SKILL_COSTS.hoodie)}
              </button>
            )}
          </div>

          {/* Cap Customization */}
          <div className={`p-5 rounded-2xl border ${playerSkills.cap ? 'bg-pink-900/20 border-pink-500/50' : 'bg-slate-800/80 border-slate-700'} flex flex-col justify-between`}>
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className={`p-3 rounded-xl ${playerSkills.cap ? 'bg-pink-500/20 text-pink-400' : 'bg-slate-700 text-slate-400'}`}>
                  <Sparkles size={28} />
                </div>
                {playerSkills.cap && <div className="bg-pink-500/20 text-pink-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Check size={14}/> ADQUIRIDO</div>}
              </div>
              <h3 className="text-lg font-black text-white uppercase">Boné Estiloso</h3>
              <p className="text-sm text-slate-400 mt-2">Acessório de cabeça moderno para proteger o foco e garantir muito estilo durante a jornada.</p>

              {playerSkills.cap && (
                <div className="mt-4 pt-3 border-t border-slate-800">
                  <p className="text-xs font-bold text-slate-300 mb-2">ESCOLHER COR DO BONÉ:</p>
                  <div className="flex gap-2">
                    {[
                      { name: 'Vermelho', hex: '#ef4444' },
                      { name: 'Azul', hex: '#3b82f6' },
                      { name: 'Amarelo', hex: '#eab308' },
                      { name: 'Verde', hex: '#10b981' },
                      { name: 'Preto', hex: '#0f172a' },
                    ].map((c) => (
                      <button
                        key={c.hex}
                        onClick={() => handleColorChange('capColor', c.hex)}
                        className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${playerSkills.capColor === c.hex ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-70 hover:opacity-100'}`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {!playerSkills.cap && (
              <button 
                onClick={() => handlePurchase('cap')}
                className={`mt-6 w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${coins >= SKILL_COSTS.cap ? 'bg-amber-500 hover:bg-amber-400 text-amber-950 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
              >
                <Coins size={18} /> {formatCurrency(SKILL_COSTS.cap)}
              </button>
            )}
          </div>

          {/* Bola de Futebol / Kit Esportivo Coletivo */}
          <div className={`p-5 rounded-2xl border ${playerSkills.soccerKit ? 'bg-emerald-900/20 border-emerald-500/50' : 'bg-slate-800/80 border-slate-700'} flex flex-col justify-between`}>
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className={`p-3 rounded-xl ${playerSkills.soccerKit ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                  <Trophy size={28} />
                </div>
                {playerSkills.soccerKit && (
                  <div className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Check size={14} /> ADQUIRIDO
                  </div>
                )}
              </div>
              <h3 className="text-lg font-black text-white uppercase">Bola de Futebol / Kit Esportivo Coletivo</h3>
              <div className="mt-2.5 space-y-2">
                <p className="text-xs text-emerald-300 font-bold bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
                  🌱 <span className="underline">Fundamento</span>: Reencontro com a convivência comunitária e práticas esportivas em equipe.
                </p>
                <p className="text-xs text-slate-300 leading-relaxed bg-white/5 p-2.5 rounded-xl border border-white/5">
                  ⚽ <span className="text-amber-300 font-bold">Efeito no Jogo</span>: Transforma a colisão com certas barreiras em um passe esportivo com efeito sonoro comemorativo, reduzindo a sobrecarga atencional.
                </p>
              </div>
            </div>
            
            {!playerSkills.soccerKit && (
              <button 
                onClick={() => handlePurchase('soccerKit')}
                className={`mt-6 w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${coins >= SKILL_COSTS.soccerKit ? 'bg-amber-500 hover:bg-amber-400 text-amber-950 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
              >
                <Coins size={18} /> {formatCurrency(SKILL_COSTS.soccerKit)}
              </button>
            )}
          </div>

          {/* Garrafa de Chá Calmante & Hidratação Consciente (Camomila & Mel) */}
          <div className={`p-5 rounded-2xl border ${playerSkills.calmingTea ? 'bg-amber-900/20 border-amber-500/50' : 'bg-slate-800/80 border-slate-700'} flex flex-col justify-between`}>
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className={`p-3 rounded-xl ${playerSkills.calmingTea ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-400'}`}>
                  <Coffee size={28} />
                </div>
                {playerSkills.calmingTea && (
                  <div className="bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Check size={14} /> ADQUIRIDO
                  </div>
                )}
              </div>
              <h3 className="text-lg font-black text-white uppercase">Garrafa de Chá Calmante & Hidratação Consciente</h3>
              <p className="text-xs text-amber-400/90 font-medium mb-1">(Camomila & Mel)</p>
              <div className="mt-2.5 space-y-2">
                <p className="text-xs text-amber-300 font-bold bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                  🍵 <span className="underline">Fundamento Científico</span>: Rituais de pausa mindful, fitoterapia e hidratação como âncoras contra a aceleração mental e a multitarefa tóxica.
                </p>
                <p className="text-xs text-slate-300 leading-relaxed bg-white/5 p-2.5 rounded-xl border border-white/5">
                  🍯 <span className="text-amber-300 font-bold">Efeito no Jogo</span>: O avatar carrega uma garrafa isotérmica; colidir com itens de descanso ou água gera cura dobrada e concede 5 segundos de serenidade absoluta.
                </p>
              </div>
            </div>
            
            {!playerSkills.calmingTea && (
              <button 
                onClick={() => handlePurchase('calmingTea')}
                className={`mt-6 w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${coins >= SKILL_COSTS.calmingTea ? 'bg-amber-500 hover:bg-amber-400 text-amber-950 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
              >
                <Coins size={18} /> {formatCurrency(SKILL_COSTS.calmingTea)}
              </button>
            )}
          </div>

          {/* Treino de Respiração Diafragmática 4-7-8 (Smartband Anti-Pânico) */}
          <div className={`p-5 rounded-2xl border ${playerSkills.breathingBand ? 'bg-teal-900/20 border-teal-500/50' : 'bg-slate-800/80 border-slate-700'} flex flex-col justify-between`}>
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className={`p-3 rounded-xl ${playerSkills.breathingBand ? 'bg-teal-500/20 text-teal-400' : 'bg-slate-700 text-slate-400'}`}>
                  <HeartPulse size={28} />
                </div>
                {playerSkills.breathingBand && (
                  <div className="bg-teal-500/20 text-teal-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Check size={14} /> ADQUIRIDO
                  </div>
                )}
              </div>
              <h3 className="text-lg font-black text-white uppercase">Treino de Respiração 4-7-8</h3>
              <p className="text-xs text-teal-400/90 font-medium mb-1">(Smartband Anti-Pânico)</p>
              <div className="mt-2.5 space-y-2">
                <p className="text-xs text-teal-300 font-bold bg-teal-500/10 p-2 rounded-xl border border-teal-500/20">
                  🫁 <span className="underline">Fundamento Científico</span>: Estimulação do nervo vago e ativação do sistema parassimpático. Ajuda a regular a variabilidade da frequência cardíaca (VFC) e desarma crises agudas de ansiedade provocadas pelo FOMO.
                </p>
                <p className="text-xs text-slate-300 leading-relaxed bg-white/5 p-2.5 rounded-xl border border-white/5">
                  ⏱️ <span className="text-amber-300 font-bold">Efeito no Jogo</span>: "Auto-Regulação de Emergência": Se a ansiedade atingir a zona crítica (acima de 75%), dispara um ciclo de respiração profunda: o tempo desacelera levemente por 2s e reduz 20% da ansiedade instantaneamente.
                </p>
              </div>
            </div>
            
            {!playerSkills.breathingBand && (
              <button 
                onClick={() => handlePurchase('breathingBand')}
                className={`mt-6 w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${coins >= SKILL_COSTS.breathingBand ? 'bg-amber-500 hover:bg-amber-400 text-amber-950 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
              >
                <Coins size={18} /> {formatCurrency(SKILL_COSTS.breathingBand)}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
