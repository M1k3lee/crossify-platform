import { useState } from 'react';
import { motion } from 'framer-motion';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  defaultValue?: string;
}

const PRESET_COLORS = [
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#EF4444', // Red
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#6366F1', // Indigo
  '#14B8A6', // Teal
];

export default function ColorPicker({ label, value, onChange, defaultValue = '#3B82F6' }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const displayValue = value || defaultValue;

  return (
    <div className="relative">
      <label className="block text-sm font-medium mb-2 text-gray-300">{label}</label>
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-lg border-2 border-gray-600 cursor-pointer hover:border-gray-500 transition"
          style={{ backgroundColor: displayValue }}
          onClick={() => setIsOpen(!isOpen)}
        />
        <input
          type="text"
          value={displayValue}
          onChange={(e) => {
            const newColor = e.target.value;
            if (/^#[0-9A-Fa-f]{0,6}$/.test(newColor)) {
              onChange(newColor);
            }
          }}
          className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white font-mono text-sm"
          placeholder="#3B82F6"
        />
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-16 left-0 z-50 bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-xl"
            style={{ minWidth: '200px' }}
          >
            <div className="grid grid-cols-5 gap-2 mb-3">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    onChange(color);
                    setIsOpen(false);
                  }}
                  className="w-8 h-8 rounded border-2 border-gray-600 hover:border-gray-400 transition"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            <input
              type="color"
              value={displayValue}
              onChange={(e) => onChange(e.target.value)}
              className="w-full h-10 rounded cursor-pointer"
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}

