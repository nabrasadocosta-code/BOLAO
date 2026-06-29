/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { QrCode, X, Share2, Sparkles, Copy, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function InviteTable() {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const inviteUrl = window.location.origin;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-40 bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase tracking-wider text-[11px] px-4 py-3 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border-2 border-black"
        id="btn-invite-table"
        title="Convide a Mesa"
      >
        <QrCode className="w-4 h-4 animate-pulse" />
        <span>Convide a Mesa</span>
      </button>

      {/* Modal Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
          id="invite-modal-backdrop"
        >
          {/* Modal Content */}
          <div 
            className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            id="invite-modal-content"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <h3 className="text-sm font-black uppercase text-white tracking-widest">Convide a Mesa!</h3>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-slate-800 text-zinc-400 hover:text-white rounded-xl transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* QR Code Canvas/SVG */}
            <div className="flex flex-col items-center justify-center bg-white p-6 rounded-2xl shadow-inner mx-auto w-48 h-48 border border-slate-200 relative">
              <QRCodeSVG 
                value={inviteUrl}
                size={144}
                level="H"
                includeMargin={false}
              />
            </div>

            {/* Description Text */}
            <div className="text-center space-y-1">
              <p className="text-[11px] font-black uppercase text-yellow-400 tracking-wider">
                Aponte a Câmera do Celular
              </p>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider leading-relaxed">
                Compartilhe o link do bolão com quem está na mesa do bar para jogarem juntos!
              </p>
            </div>

            {/* Copy Link Button */}
            <div className="pt-2 border-t border-slate-850">
              <button
                onClick={handleCopyLink}
                className="w-full py-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-zinc-200 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Link Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Link do Bolão</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
