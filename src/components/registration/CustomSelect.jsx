import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Futuristic Custom Select Dropdown
 * Built for high accessibility, custom dark styling, and smooth interactions.
 */
export default function CustomSelect({
  id,
  label,
  required = false,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  helperText,
  error,
  disabled = false,
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (optionValue) => {
    if (disabled) return;
    onChange(optionValue);
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (disabled) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(0);
      } else {
        setHighlightedIndex((prev) => (prev + 1) % options.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(options.length - 1);
      } else {
        setHighlightedIndex((prev) => (prev - 1 + options.length) % options.length);
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (isOpen && highlightedIndex >= 0 && highlightedIndex < options.length) {
        handleSelect(options[highlightedIndex].value);
      } else {
        setIsOpen(!isOpen);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Tab') {
      setIsOpen(false);
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`} ref={containerRef}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-medium text-[#A2ADA6]"
        >
          {label} {required && <span className="text-[#22A447] font-semibold">*</span>}
        </label>
      )}

      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          id={id}
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-[#171F1B] border text-left text-sm transition-all duration-150 focus:outline-none ${
            error
              ? 'border-rose-500/80 bg-rose-950/20 focus:ring-1 focus:ring-rose-500/50'
              : isOpen
              ? 'border-[#22A447] ring-1 ring-[#22A447]'
              : 'border-[#28342D] hover:border-[#3A4B41] focus:border-[#22A447] focus:ring-1 focus:ring-[#22A447]'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span className={selectedOption ? 'text-[#F5F7F5] font-medium' : 'text-[#707E75]'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-[#A2ADA6] transition-transform duration-150 flex-shrink-0 ml-2 ${
              isOpen ? 'rotate-180 text-[#22A447]' : ''
            }`}
          />
        </button>

        {isOpen && (
          <div
            role="listbox"
            tabIndex={-1}
            className="absolute z-50 mt-1.5 w-full rounded-lg bg-[#121916] border border-[#28342D] shadow-xl overflow-hidden py-1 backdrop-blur-md animate-in fade-in-50 duration-100"
          >
            {options.map((option, idx) => {
              const isSelected = option.value === value;
              const isHighlighted = idx === highlightedIndex;
              return (
                <div
                  key={option.value || idx}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(option.value)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`px-3.5 py-2.5 text-xs sm:text-sm cursor-pointer flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-[#22A447]/15 text-[#22A447] font-semibold'
                      : isHighlighted
                      ? 'bg-[#171F1B] text-[#F5F7F5]'
                      : 'text-[#A2ADA6] hover:bg-[#171F1B] hover:text-[#F5F7F5]'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{option.label}</span>
                    {option.description && (
                      <span className="text-[11px] text-[#707E75] mt-0.5">{option.description}</span>
                    )}
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[#22A447] flex-shrink-0 ml-2" />}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {helperText && !error && (
        <p className="text-[11px] text-[#707E75] flex items-center gap-1">
          {helperText}
        </p>
      )}

      {error && (
        <p className="text-[11px] text-rose-400 font-medium flex items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-400"></span>
          {error}
        </p>
      )}
    </div>
  );
}
