import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { QrCode, ExternalLink, Copy, Check, Printer } from 'lucide-react';

interface QRCodeCardProps {
  url?: string;
  title?: string;
  compact?: boolean;
}

export const QRCodeCard: React.FC<QRCodeCardProps> = ({
  url = 'https://sobrecarga-digital.ai.studio',
  title = 'Entre Redes Há Ansiedade',
  compact = false,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(url, {
      width: compact ? 160 : 220,
      margin: 2,
      color: {
        dark: '#020617',
        light: '#ffffff',
      },
    })
      .then((dataUri) => setQrDataUrl(dataUri))
      .catch((err) => console.error('Error generating QR code:', err));
  }, [url, compact]);
  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`bg-black/60 border border-cyan-400/40 text-center shadow-[0_0_30px_rgba(34,211,238,0.18)] ${
      compact ? 'rounded-xl p-2 flex flex-row items-center gap-2.5 text-left' : 'rounded-3xl p-5 flex flex-col items-center gap-4'
    }`}>
      {qrDataUrl ? (
        <div className={`bg-white rounded-lg border border-cyan-400/50 shadow-md shrink-0 flex items-center justify-center ${
          compact ? 'p-1' : 'p-2.5 rounded-2xl'
        }`}>
          <img src={qrDataUrl} alt="QR Code" className={`${compact ? 'w-14 h-14' : 'w-32 h-32'} rounded object-contain`} />
        </div>
      ) : (
        <div className={`${compact ? 'w-14 h-14' : 'w-32 h-32'} bg-cyan-950/40 rounded-lg border border-cyan-400/30 animate-pulse shrink-0 flex items-center justify-center`}>
          <QrCode className="w-6 h-6 text-cyan-400 animate-spin" />
        </div>
      )}

      <div className="flex flex-col items-center gap-1 w-full">
        {!compact ? (
          <>
            <div className="flex items-center gap-1 text-cyan-300 font-bold text-[9px] uppercase tracking-[0.12em] justify-center">
              <QrCode className="w-3 h-3 text-cyan-400 shrink-0" /> {title}
            </div>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-cyan-400 font-bold hover:underline flex items-center gap-1 justify-center break-all text-xs sm:text-sm"
            >
              {url} <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
            <p className="text-slate-300 leading-snug max-w-sm text-[11px]">
              Escaneie o QR Code para acessar o simulador.
            </p>
            <div className="flex items-center justify-center gap-1.5 pt-1 flex-wrap">
              <button
                onClick={handleCopy}
                className="bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 rounded-xl font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1 transition-all cursor-pointer active:scale-95 px-4 py-2 text-[10px]"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copiado!' : 'Copiar URL'}
              </button>

              <a
                href="?print=true"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 rounded-xl font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1 transition-all cursor-pointer active:scale-95 px-4 py-2 text-[10px]"
              >
                <Printer className="w-3 h-3 text-emerald-400 shrink-0" /> Imprimir
              </a>
            </div>
          </>
        ) : (
          <div className="text-left space-y-0.5 w-full flex flex-col justify-center">
            <span className="text-[9px] font-bold text-cyan-300 uppercase tracking-wider block">Acesso Rápido</span>
            <p className="text-[10px] text-slate-300 leading-tight">
              Escaneie o código para abrir o simulador em seu celular.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
