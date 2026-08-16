import React from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { useAdminTheme } from '../../context/AdminThemeContext';

export default function ContentCrudModule({
  title,
  subtitle,
  items = [],
  loading = false,
  onAdd,
  filterOptions = [],
  activeFilter = 'All',
  onFilterChange,
  searchTerm = '',
  onSearchChange,
  renderRow,
  renderCard,
  gridCols = 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4',
  columns = []
}) {
  const { isLight } = useAdminTheme();

  const hasActionsCol = columns.some(c => c.toLowerCase() === 'actions');

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl border transition-colors ${
        isLight
          ? 'bg-white border-gray-200 shadow-sm'
          : 'bg-[#161b22] border-[#30363d] shadow-md'
      }`}>
        <div>
          <h1 className={`text-2xl font-extrabold tracking-tight ${isLight ? 'text-gray-900' : 'text-white'}`}>{title}</h1>
          <p className={`text-xs sm:text-sm mt-1 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>{subtitle}</p>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-button text-xs font-bold shadow-md self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Create New Record
        </button>
      </div>

      {/* Toolbar: Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${isLight ? 'text-gray-400' : 'text-gray-500'}`} />
          <input
            type="text"
            placeholder={`Search ${title.toLowerCase()}...`}
            value={searchTerm}
            onChange={e => onSearchChange && onSearchChange(e.target.value)}
            className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-xs font-medium border transition-colors focus:outline-none focus:border-[#2f9e44] ${
              isLight
                ? 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 shadow-sm'
                : 'bg-[#161b22] border-[#30363d] text-white placeholder-gray-500'
            }`}
          />
        </div>

        {/* Filter Pills */}
        {filterOptions.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1">
            <Filter className={`w-4 h-4 mr-1 flex-shrink-0 ${isLight ? 'text-gray-400' : 'text-gray-500'}`} />
            {filterOptions.map(opt => (
              <button
                key={opt}
                onClick={() => onFilterChange && onFilterChange(opt)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeFilter === opt
                    ? 'bg-[#2f9e44] text-white shadow-sm'
                    : isLight
                    ? 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 shadow-sm'
                    : 'bg-[#161b22] text-gray-400 hover:text-white border border-[#30363d]'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content Container (Card Grid or Table) */}
      <div className={`rounded-2xl border overflow-hidden transition-colors ${
        isLight
          ? 'bg-white border-gray-200 shadow-sm'
          : 'bg-[#161b22] border-[#30363d] shadow-xl'
      }`}>
        {loading ? (
          <div className={`p-16 text-center text-xs font-semibold ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
            <div className="w-8 h-8 border-2 border-[#2f9e44] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            Loading {title}...
          </div>
        ) : items.length === 0 ? (
          <div className={`p-16 text-center space-y-1 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
            <p className="text-sm font-bold">No records found</p>
            <p className="text-xs">Click "Create New Record" to add your first item.</p>
          </div>
        ) : renderCard ? (
          <div className={`p-5 sm:p-6 grid ${gridCols} gap-4 sm:gap-5`}>
            {items.map((item, idx) => (
              <React.Fragment key={item._id || idx}>
                {renderCard(item)}
              </React.Fragment>
            ))}
          </div>
        ) : typeof renderRow === 'function' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium">
              <thead className={`text-[10px] uppercase font-mono tracking-wider border-b ${
                isLight
                  ? 'bg-slate-50 text-slate-600 border-gray-200'
                  : 'bg-[#0d1117] text-gray-400 border-[#30363d]'
              }`}>
                <tr>
                  {columns.map((col, idx) => (
                    <th key={idx} className={`px-6 py-4 font-bold ${col.toLowerCase() === 'actions' ? 'text-center' : ''}`}>
                      {col}
                    </th>
                  ))}
                  {!hasActionsCol && (
                    <th className="px-6 py-4 font-bold text-center">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-gray-200' : 'divide-[#30363d]'}`}>
                {items.map((item) => renderRow(item))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

    </div>
  );
}
