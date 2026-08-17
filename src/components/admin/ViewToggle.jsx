import React from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { useAdminTheme } from '../../context/AdminThemeContext';

/**
 * Reusable Segmented ViewToggle Component for Admin Panel
 * @param {string} viewMode - 'grid' | 'list'
 * @param {function} onChange - (newMode: 'grid' | 'list') => void
 * @param {string} className - Optional container classes
 */
export default function ViewToggle({ viewMode = 'grid', onChange, className = '' }) {
  const { isLight } = useAdminTheme();

  return (
    <div
      role="group"
      aria-label="View layout toggle"
      className={`inline-flex items-center p-1 rounded-xl border transition-colors select-none ${
        isLight
          ? 'bg-gray-100/90 border-gray-300 shadow-xs'
          : 'bg-[#0d1117] border-[#30363d] shadow-xs'
      } ${className}`}
    >
      <button
        type="button"
        onClick={() => onChange && onChange('grid')}
        aria-label="Grid view"
        aria-pressed={viewMode === 'grid'}
        title="Grid view (cards)"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 active:scale-95 ${
          viewMode === 'grid'
            ? 'bg-[#2f9e44] text-white shadow-xs'
            : isLight
            ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/70'
            : 'text-gray-400 hover:text-white hover:bg-[#161b22]'
        }`}
      >
        <LayoutGrid className="w-4 h-4 flex-shrink-0" />
        <span className="text-[11px]">Grid</span>
      </button>

      <button
        type="button"
        onClick={() => onChange && onChange('list')}
        aria-label="List view"
        aria-pressed={viewMode === 'list'}
        title="List view (table)"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 active:scale-95 ${
          viewMode === 'list'
            ? 'bg-[#2f9e44] text-white shadow-xs'
            : isLight
            ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/70'
            : 'text-gray-400 hover:text-white hover:bg-[#161b22]'
        }`}
      >
        <List className="w-4 h-4 flex-shrink-0" />
        <span className="text-[11px]">List</span>
      </button>
    </div>
  );
}
