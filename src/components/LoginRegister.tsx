/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, Shield, AlertTriangle, KeyRound } from 'lucide-react';
import PhoneMaskInput from './PhoneMaskInput';
import { motion, AnimatePresence } from 'motion/react';

interface LoginRegisterProps {
  onLoginSuccess: (user: any) => void;
}

export default function LoginRegister({ onLoginSuccess }: LoginRegisterProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Submissão do Formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validações básicas
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setError("Por favor, insira um telefone válido com DDD.");
      return;
    }

    if (pin.length !== 4) {
      setError("O seu PIN de acesso deve conter exatamente 4 números.");
      return;
    }

    if (activeTab === 'register' && name.trim().length < 3) {
      setError("Por favor, insira seu nome completo (mínimo 3 letras).");
      return;
    }

    setLoading(true);

    try {
      const endpoint = activeTab === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload = activeTab === 'login' 
        ? { phone: cleanPhone, pin } 
        : { name: name.trim(), phone: cleanPhone, pin };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Algo deu errado. Tente novamente.");
      }

      // Salva token/userID no localStorage
      localStorage.setItem("bolao_userId", data.user.id);
      
      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message || "Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  // Switch tabs
  const handleTabChange = (tab: 'login' | 'register') => {
    setActiveTab(tab);
    setPin('');
    setError(null);
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-8" id="login-register-page">
      {/* Branding Header */}
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-block bg-yellow-400 text-black font-black px-4 py-1.5 text-xl sm:text-2xl skew-x-[-12deg] shadow-lg shadow-yellow-450/20 mb-3 select-none"
        >
          PIER
        </motion.div>
        
        <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">
          BOLÃO DO <span className="text-emerald-500">COSTA</span>
        </h2>
        <p className="text-zinc-400 text-xs mt-1 font-bold max-w-xs mx-auto uppercase tracking-wide">
          ⚽ Palpite, cerveja gelada & grana no bolso! 🍺
        </p>
      </div>

      {/* Login / Register Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl shadow-2xl p-5 relative overflow-hidden backdrop-blur-md">
        {/* Neon light stripe */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-yellow-400"></div>

        {/* Tab Switches */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => handleTabChange('login')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all duration-300 ${
              activeTab === 'login'
                ? 'bg-yellow-400 text-black shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('register')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all duration-300 ${
              activeTab === 'register'
                ? 'bg-yellow-400 text-black shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Criar Conta
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {activeTab === 'register' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-1.5"
                key="register-name-field"
              >
                <label className="block text-xs font-black uppercase tracking-wider text-zinc-400">
                  Nome Completo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-zinc-500" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Pedro Silva"
                    className="block w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Phone Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-black uppercase tracking-wider text-zinc-400">
              Celular / WhatsApp
            </label>
            <PhoneMaskInput
              value={phone}
              onChange={(val) => {
                setPhone(val);
                setError(null);
              }}
            />
          </div>

          {/* PIN Access Display */}
          <div className="space-y-2 mt-4">
            <label className="block text-center text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center justify-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-yellow-400" />
              Senha PIN (4 dígitos)
            </label>

            {/* Visual Slots with actual text input */}
            <div 
              className="relative flex justify-center gap-4 py-2 cursor-pointer" 
              onClick={() => document.getElementById('pin-hidden-input')?.focus()}
            >
              <input
                id="pin-hidden-input"
                type="text"
                maxLength={4}
                inputMode="numeric"
                pattern="[0-9]*"
                value={pin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setPin(val);
                  setError(null);
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-transparent selection:bg-transparent"
                style={{ fontSize: '16px' }}
                autoComplete="off"
              />

              {[0, 1, 2, 3].map((index) => {
                const isFocused = pin.length === index;
                const hasValue = pin.length > index;
                return (
                  <div
                    key={index}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 transition-all duration-200 text-lg font-black ${
                      hasValue
                        ? 'bg-yellow-400 border-yellow-300 text-black scale-105 shadow-md shadow-yellow-500/25'
                        : isFocused
                        ? 'bg-slate-950 border-yellow-400 text-white shadow-inner shadow-yellow-400/10 scale-105'
                        : 'bg-slate-950 border-slate-800 text-slate-700'
                    }`}
                  >
                    {pin[index] || ''}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3 bg-red-950/40 border border-red-800 rounded-xl flex items-start gap-2 text-red-300 text-xs font-semibold"
            >
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Action Button */}
          <button
            type="submit"
            disabled={loading || pin.length !== 4 || (activeTab === 'register' && name.trim().length < 3)}
            className="w-full mt-4 py-3.5 bg-yellow-400 hover:bg-yellow-300 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:border-transparent text-zinc-950 font-black uppercase text-sm tracking-wider rounded-xl transition-all shadow-lg active:scale-95 duration-200 border-b-4 border-yellow-600 active:border-b-0 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              activeTab === 'login' ? "Entrar no Bolão" : "Cadastrar e Entrar"
            )}
          </button>
        </form>
      </div>

      {/* Note */}
      <div className="mt-6 flex items-center justify-center gap-1.5 text-center text-zinc-500 text-[11px] font-bold uppercase tracking-wider">
        <Shield className="w-3.5 h-3.5 text-zinc-500" />
        Acesso Rápido Seguro • Sem E-mail ou SPAM
      </div>
    </div>
  );
}
