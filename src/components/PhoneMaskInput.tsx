/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Phone } from 'lucide-react';

interface PhoneMaskInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function PhoneMaskInput({ value, onChange, placeholder = "(00) 00000-0000", disabled = false }: PhoneMaskInputProps) {
  
  const formatPhone = (input: string) => {
    // Remove tudo que não for dígito
    const digits = input.replace(/\D/g, "");
    
    // Limita em 11 dígitos
    const limited = digits.substring(0, 11);
    
    // Aplica máscara (XX) XXXXX-XXXX
    if (limited.length <= 2) {
      return limited;
    }
    if (limited.length <= 7) {
      return `(${limited.substring(0, 2)}) ${limited.substring(2)}`;
    }
    return `(${limited.substring(0, 2)}) ${limited.substring(2, 7)}-${limited.substring(7, 11)}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const formatted = formatPhone(rawVal);
    onChange(formatted);
  };

  return (
    <div className="relative w-full" id="phone-input-container">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
        <Phone className="h-4 w-4 text-zinc-500" />
      </div>
      <input
        type="tel"
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        disabled={disabled}
        className="block w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm md:text-base tracking-wide"
        id="phone-input-field"
      />
    </div>
  );
}
