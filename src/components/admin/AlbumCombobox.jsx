import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, Plus, Check, FolderPlus } from 'lucide-react';
import { useAdminTheme } from '../../context/AdminThemeContext';

const norm = (s) => (s || '').trim().replace(/\s+/g, ' ');

/**
 * Searchable album field. `albums` is the list of existing album names
 * (derived from existing gallery items). Typing a name that does not exist
 * offers a "Create new album" option; existing names are matched
 * case-insensitively so duplicates are never created.
 */
export default function AlbumCombobox({ value, onChange, albums = [], placeholder = 'Search or type an album name…' }) {
  const { isLight } = useAdminTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const wrapRef = useRef(null);

  useEffect(() => { setQuery(value || ''); }, [value]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setQuery(value || '');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [value]);

  const cleaned = norm(query);
  const matches = useMemo(() => {
    const q = cleaned.toLowerCase();
    return albums.filter(a => !q || a.toLowerCase().includes(q));
  }, [albums, cleaned]);
  const exact = albums.find(a => a.toLowerCase() === cleaned.toLowerCase());
  const canCreate = cleaned.length > 0 && !exact;

  const choose = (name) => {
    onChange(name);
    setQuery(name);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (exact) choose(exact);
      else if (canCreate) choose(cleaned);
      else if (matches.length === 1) choose(matches[0]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const border = isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-[#0d1117] border-[#30363d] text-white';
  const itemHover = isLight ? 'hover:bg-slate-100' : 'hover:bg-[#21262d]';

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(e) => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
          onKeyDown={onKeyDown}
          className={`w-full rounded-xl pl-3 pr-9 py-2 border text-xs font-semibold focus:outline-none focus:border-[#2f9e44] ${border}`}
        />
        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      {open && (
        <div className={`absolute z-30 mt-1 w-full max-h-56 overflow-y-auto rounded-xl border shadow-xl ${
          isLight ? 'bg-white border-gray-200' : 'bg-[#161b22] border-[#30363d]'
        }`}>
          {canCreate && (
            <button
              type="button"
              onClick={() => choose(cleaned)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs font-bold text-[#2f9e44] border-b ${
                isLight ? 'border-gray-100' : 'border-[#30363d]'
              } ${itemHover}`}
            >
              <FolderPlus className="w-4 h-4" /> Create new album “{cleaned}”
            </button>
          )}
          {matches.map(a => (
            <button
              type="button"
              key={a}
              onClick={() => choose(a)}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-xs font-semibold ${
                isLight ? 'text-gray-800' : 'text-gray-200'
              } ${itemHover}`}
            >
              <span className="truncate">{a}</span>
              {a === value && <Check className="w-3.5 h-3.5 text-[#2f9e44] flex-shrink-0" />}
            </button>
          ))}
          {!canCreate && matches.length === 0 && (
            <div className="px-3 py-2 text-xs text-gray-500 flex items-center gap-2"><Plus className="w-3.5 h-3.5" /> Type a name to create an album</div>
          )}
        </div>
      )}
    </div>
  );
}
