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
  const [openUpward, setOpenUpward] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const listboxRef = useRef(null);
  const optionRefs = useRef([]);

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

  // Compute dropdown placement (upward vs downward) and scroll highlighted item into view
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      // If cramped below (< 210px) and more space exists above, flip upward
      if (spaceBelow < 210 && spaceAbove > 180) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
        // On small mobile screens, gently adjust scroll if button is too close to bottom
        if (spaceBelow < 180) {
          buttonRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && optionRefs.current[highlightedIndex]) {
      optionRefs.current[highlightedIndex].scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex, isOpen]);

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
            ref={listboxRef}
            role="listbox"
            tabIndex={-1}
            style={{ WebkitOverflowScrolling: 'touch' }}
            className={`absolute z-50 w-full rounded-lg bg-[#121916] border border-[#28342D] shadow-2xl overflow-y-auto max-h-48 sm:max-h-56 py-1 backdrop-blur-md animate-in fade-in-50 duration-100 overscroll-contain touch-pan-y ${
              openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
            }`}
          >
            {options.map((option, idx) => {
              const isSelected = option.value === value;
              const isHighlighted = idx === highlightedIndex;
              return (
                <div
                  key={option.value || idx}
                  ref={(el) => (optionRefs.current[idx] = el)}
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
