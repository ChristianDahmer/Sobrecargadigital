import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Printer, ArrowLeft, ShieldAlert, Award } from 'lucide-react';

export const PrintViewPage: React.FC = () => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://sobrecarga-digital.ai.studio';

  useEffect(() => {
    QRCode.toDataURL(appUrl, {
      width: 250,
      margin: 2,
      color: {
        dark: '#0369a1', // Beautiful dark cyan blue for print
        light: '#ffffff',
      },
    })
      .then((dataUri) => {
        setQrDataUrl(dataUri);
        // Automatically open the print dialog after a brief delay so the user has visual feedback
        setTimeout(() => {
          window.print();
        }, 800);
      })
      .catch((err) => console.error('Error generating print QR code:', err));
  }, [appUrl]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-start p-4 sm:p-8 font-sans">
      {/* Print only CSS to hide interface buttons */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background-color: #ffffff !important;
            padding: 0 !important;
          }
          .print-card {
            border: none !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            max-width: 100% !important;
          }
        }
      `}} />

      {/* Interface Controls (Hidden when printing) */}
      <div className="no-print w-full max-w-[620px] flex justify-between items-center mb-6 gap-4">
        <a
          href={appUrl}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao Simulador
        </a>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md active:scale-95 hover:shadow-lg"
        >
          <Printer className="w-4 h-4" /> Abrir Caixa de Impressão
        </button>
      </div>

      {/* Main Printable Document Card */}
      <div className="print-card w-full max-w-[620px] bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-md text-center flex flex-col gap-8">
        
        {/* Header Branding */}
        <div className="border-b-4 border-cyan-600 pb-6 flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-cyan-600 mb-1">
            <ShieldAlert className="w-6 h-6 no-print" />
            <span className="text-[10px] font-black tracking-[0.25em] uppercase text-cyan-700">
              Estudo de Impacto Tecnológico • Turma 61
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-none">
            Entre Redes Há Ansiedade
          </h1>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
            Simulador de Sobrecarga Psicológica & Escala SAS-SMU
          </p>
        </div>

        {/* Informative Body Section */}
        <div className="text-left space-y-4">
          <p className="text-sm leading-relaxed text-slate-600">
            Este simulador interativo explora empiricamente como o excesso de estímulos digitais e as interrupções de redes sociais afetam nossa saúde mental, tempo de reação e bem-estar psicológico.
          </p>

          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex items-start gap-3">
            <Award className="w-5 h-5 text-cyan-600 shrink-0 mt-0.5 no-print" />
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Objetivos da Pesquisa Educacional</h4>
              <p className="text-xs leading-relaxed text-slate-500">
                Avaliar a suscetibilidade individual ao estresse e à urgência de resposta rápida (efeito FOMO) por meio de um teste gamificado de 60 segundos com avaliações integradas em tempo real.
              </p>
            </div>
          </div>
        </div>

        {/* QR Code Block */}
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="bg-white border-2 border-cyan-600 p-4 rounded-3xl shadow-sm inline-block">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Code" className="w-[200px] h-[200px] block" />
            ) : (
              <div className="w-[200px] h-[200px] bg-slate-100 rounded-2xl animate-pulse flex items-center justify-center">
                <span className="text-xs text-slate-400">Gerando QR Code...</span>
              </div>
            )}
          </div>
          <div>
            <span className="text-sm font-bold text-cyan-600 block hover:underline">
              {appUrl}
            </span>
            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
              Acesso Direto Dinâmico
            </span>
          </div>
        </div>

        {/* Clear Step-by-Step Instructions */}
        <div className="bg-cyan-50 border border-cyan-100 rounded-2xl p-6 text-left">
          <h3 className="text-xs font-black text-cyan-800 uppercase tracking-wider mb-3">
            Como acessar o simulador pedagógico:
          </h3>
          <ol className="text-xs text-slate-600 space-y-2.5 list-decimal pl-4 leading-relaxed">
            <li>
              <strong className="text-slate-800">Escaneie:</strong> Abra o aplicativo de câmera de seu smartphone ou tablet e aponte para o QR Code.
            </li>
            <li>
              <strong className="text-slate-800">Experimente:</strong> Participe da simulação interativa desviando de estímulos e gerenciando sua ansiedade sob estresse.
            </li>
            <li>
              <strong className="text-slate-800">Avalie:</strong> Responda às perguntas psicométricas integradas para gerar seu perfil na escala SAS-SMU.
            </li>
          </ol>
        </div>

        {/* Printable Footer */}
        <div className="border-t border-slate-100 pt-5 text-slate-400 text-[10px] leading-relaxed">
          <p className="font-semibold text-slate-500">Simulador de Saúde e Tecnologia • Disciplina de Mapeamento Comportamental</p>
          <p className="mt-0.5">Desenvolvido como ferramenta de conscientização e diagnóstico para ambientes escolares e clínicos.</p>
        </div>

      </div>
    </div>
  );
};
