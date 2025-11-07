import { useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';

interface AdvancedSettingsProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  defaultOpen?: boolean;
}

export default function AdvancedSettings({ 
  children, 
  title, 
  description,
  defaultOpen = false 
}: AdvancedSettingsProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-700 rounded-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-gray-800 hover:bg-gray-750 rounded-lg transition"
      >
        <div className="flex items-center space-x-2">
          <span className="font-semibold">{title}</span>
          {description && (
            <div className="group relative">
              <Info className="w-4 h-4 text-gray-400" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                {description}
              </div>
            </div>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>
      {isOpen && (
        <div className="p-4 bg-gray-850 border-t border-gray-700 rounded-b-lg mt-2">
          {children}
        </div>
      )}
    </div>
  );
}

