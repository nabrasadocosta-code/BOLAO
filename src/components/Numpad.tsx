/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Delete } from 'lucide-react';
import { motion } from 'motion/react';

interface NumpadProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  onClear: () => void;
  disabled?: boolean;
}

export default function Numpad({ onKeyPress, onDelete, onClear, disabled = false }: NumpadProps) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div className="w-full max-w-xs mx-auto mt-4 bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800 shadow-inner" id="virtual-numpad">
      <div className="grid grid-cols-3 gap-2.5">
        {keys.map((key) => (
          <motion.button
            key={key}
            type="button"
            disabled={disabled}
            whileTap={{ scale: 0.92, backgroundColor: '#047857' }}
            onClick={() => onKeyPress(key)}
            className="h-14 bg-zinc-800 hover:bg-zinc-700 active:bg-emerald-700 text-white font-black text-xl rounded-xl flex items-center justify-center transition-all shadow-md active:text-white border border-zinc-700/50 disabled:opacity-50"
          >
            {key}
          </motion.button>
        ))}

        {/* Clear Button */}
        <motion.button
          type="button"
          disabled={disabled}
          whileTap={{ scale: 0.92, backgroundColor: '#3f3f46' }}
          onClick={onClear}
          className="h-14 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white font-bold text-sm rounded-xl flex items-center justify-center transition-all shadow-md border border-zinc-700/50 disabled:opacity-50 uppercase"
        >
          Limpar
        </motion.button>

        {/* 0 Button */}
        <motion.button
          type="button"
          disabled={disabled}
          whileTap={{ scale: 0.92, backgroundColor: '#047857' }}
          onClick={() => onKeyPress('0')}
          className="h-14 bg-zinc-800 hover:bg-zinc-700 active:bg-emerald-700 text-white font-black text-xl rounded-xl flex items-center justify-center transition-all shadow-md border border-zinc-700/50 disabled:opacity-50"
        >
          0
        </motion.button>

        {/* Delete/Backspace Button */}
        <motion.button
          type="button"
          disabled={disabled}
          whileTap={{ scale: 0.92, backgroundColor: '#3f3f46' }}
          onClick={onDelete}
          className="h-14 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl flex items-center justify-center transition-all shadow-md border border-zinc-700/50 disabled:opacity-50"
        >
          <Delete className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  );
}
