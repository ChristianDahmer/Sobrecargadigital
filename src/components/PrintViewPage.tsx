import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Printer, ArrowLeft, ShieldAlert, Award, Smartphone } from 'lucide-react';

export const PrintViewPage: React.FC = () => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://sobrecarga-digital.ai.studio';

  useEffect(() => {
    QRCode.toDataURL(appUrl, {
      width: 220,
      margin: 1,
      color: {
        dark: '#0369a1', // Beautiful dark cyan blue for print
        light: '#ffffff',
      },
    })
      .then((dataUri) => {
        setQrDataUrl(dataUri);
        // Automatically open the print dialog after a brief delay so user sees document ready
        const timer = setTimeout(() => {
          window.print();
        }, 600);
        return () => clearTimeout(timer);
      })
      .catch((err) => console.error('Error generating print QR code:', err));
  }, [appUrl]);

  return (
    <div className="print-page-wrapper min-h-screen bg-slate-100 text-slate-800 flex flex-col items-center justify-start p-4 sm:p-6 font-sans">
      {/* Print only CSS to enforce strictly a SINGLE PAGE without blank spillover */}
      <style dangerouslySetInnerHTML={{ __html: `
        @page {
          size: A4 portrait;
          margin: 8mm 10mm;
        }

        @media print {
          *, *::before, *::after {
            box-sizing: border-box !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          html, body {
            width: 100% !important;
            height: 100% !important;
            max-height: 100% !important;
            overflow: hidden !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }

          .no-print {
            display: none !important;
          }

          .print-page-wrapper {
            min-height: 0 !important;
            height: 100% !important;
            max-height: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
            overflow: hidden !important;
            justify-content: flex-start !important;
          }

          .print-card {
            border: none !important;
            box-shadow: none !important;
            margin: 0 auto !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            max-height: 100% !important;
            gap: 10px !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
        }
      `}} />

      {/* Interface Controls (Hidden when printing) */}
      <div className="no-print w-full max-w-[580px] flex justify-between items-center mb-4 gap-4">
        <a
          href={appUrl}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao Simulador
        </a>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md active:scale-95 hover:shadow-lg"
        >
          <Printer className="w-4 h-4" /> Imprimir Documento
        </button>
      </div>

      {/* Main Printable Document Card (Calibrated for strict 1-Page A4) */}
      <div className="print-card w-full max-w-[580px] bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-md text-center flex flex-col gap-4">
        
        {/* Header Branding */}
        <div className="border-b-2 border-cyan-600 pb-3 flex flex-col items-center gap-1">
          <div className="flex items-center gap-1.5 text-cyan-600 mb-0.5">
            <ShieldAlert className="w-5 h-5 no-print" />
            <span className="text-[10px] font-black tracking-[0.2em] uppercase text-cyan-700">
              Estudo de Impacto Tecnológico • Turma 61
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight leading-tight">
            Entre Redes Há Ansiedade
          </h1>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Simulador de Sobrecarga Psicológica & Escala SAS-SMU
          </p>
        </div>

        {/* Informative Body Section */}
        <div className="text-left space-y-2">
          <p className="text-xs leading-relaxed text-slate-600">
            Simulador interativo criado para avaliar empiricamente o impacto de notificações excessivas e interrupções digitais sobre o estresse e a ansiedade (efeito FOMO).
          </p>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-start gap-2.5">
            <Award className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5 no-print" />
            <div>
              <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">
                Objetivo Educacional & Diagnóstico
              </h4>
              <p className="text-[11px] leading-relaxed text-slate-500">
                Vivencie a corrida de 60 segundos gerenciando os estímulos na pista e responda às avaliações psicométricas para mapear seu perfil de uso consciente de telas.
              </p>
            </div>
          </div>
        </div>

        {/* QR Code Block */}
        <div className="flex flex-col items-center gap-2 py-1">
          <div className="bg-white border-2 border-cyan-600 p-2.5 rounded-2xl shadow-sm inline-block">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Code" className="w-[150px] h-[150px] sm:w-[160px] sm:h-[160px] block object-contain" />
            ) : (
              <div className="w-[150px] h-[150px] bg-slate-100 rounded-xl animate-pulse flex items-center justify-center">
                <span className="text-xs text-slate-400">Gerando QR Code...</span>
              </div>
            )}
          </div>
          <div>
            <span className="text-xs sm:text-sm font-bold text-cyan-700 block">
              {appUrl}
            </span>
            <span className="text-[9px] text-slate-400 uppercase font-mono tracking-wider">
              Acesso Direto ao Jogo no Navegador
            </span>
          </div>
        </div>

        {/* Clear Step-by-Step Instructions */}
        <div className="bg-cyan-50/80 border border-cyan-100 rounded-xl p-3.5 text-left">
          <h3 className="text-[11px] font-black text-cyan-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-cyan-700 no-print" />
            <span>Como acessar pelo smartphone ou tablet:</span>
          </h3>
          <ol className="text-[11px] text-slate-600 space-y-1 list-decimal pl-4 leading-relaxed">
            <li>
              <strong className="text-slate-800">Aponte a Câmera:</strong> Abra o aplicativo de câmera e mire no QR Code acima.
            </li>
            <li>
              <strong className="text-slate-800">Inicie o Simulador:</strong> Toque no link sugerido para abrir o jogo diretamente.
            </li>
            <li>
              <strong className="text-slate-800">Avalie sua Resposta:</strong> Complete a partida e consulte o laudo diagnóstico na Escala SAS.
            </li>
          </ol>
        </div>

        {/* Printable Footer */}
        <div className="border-t border-slate-100 pt-2 text-slate-400 text-[9px] leading-snug">
          <p className="font-semibold text-slate-500">EEEM Felipe Camarão • Projeto de Pesquisa Científica Escolar</p>
          <p className="mt-0.5">Ferramenta pedagógica para conscientização e saúde mental na era digital.</p>
        </div>

      </div>
    </div>
  );
};
