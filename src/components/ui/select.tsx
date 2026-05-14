'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'default';
}

export function Select({
  options,
  value,
  onChange,
  placeholder = '请选择',
  searchable = false,
  clearable = false,
  disabled = false,
  className,
  size = 'default',
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = options.find(o => o.value === value);

  const filtered = search
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open && searchable && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open, searchable]);

  const handleSelect = useCallback((opt: SelectOption) => {
    if (opt.disabled) return;
    onChange?.(opt.value);
    setOpen(false);
    setSearch('');
  }, [onChange]);

  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.('');
    setSearch('');
  }, [onChange]);

  const h = size === 'sm' ? 'h-8' : 'h-9';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { if (!disabled) { setOpen(!open); setSearch(''); } }}
        className={cn(
          'flex w-full items-center justify-between gap-1.5 rounded-lg border border-border bg-background px-3 transition-colors',
          h, textSize,
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-muted-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary/30',
          open && 'border-primary ring-1 ring-primary/30'
        )}
      >
        <span className={cn('truncate', selected ? 'text-foreground' : 'text-muted-foreground')}>
          {selected ? selected.label : placeholder}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          {clearable && value && !disabled && (
            <X
              className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground transition-colors"
              onClick={handleClear}
            />
          )}
          <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
        </span>
      </button>

      {/* Dropdown - z-[10000] to appear above Modal */}
      {open && (
        <div className="absolute z-[10000] mt-1 w-full rounded-lg border border-border bg-popover shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100">
          {searchable && (
            <div className="p-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  ref={searchRef}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="搜索..."
                  className={cn('w-full pl-8 pr-3 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary', size === 'sm' ? 'h-7 text-xs' : 'h-8 text-sm')}
                />
              </div>
            </div>
          )}
          <div className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-6 text-center text-muted-foreground text-sm">无匹配选项</div>
            ) : (
              filtered.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  disabled={opt.disabled}
                  className={cn(
                    'flex w-full items-center justify-between px-3 py-2 transition-colors',
                    textSize,
                    opt.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                    opt.value === value
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-muted'
                  )}
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.value === value && <Check className="w-4 h-4 shrink-0 text-primary" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Multi-select variant
interface MultiSelectProps {
  options: SelectOption[];
  value?: string[];
  onChange?: (value: string[]) => void;
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  className?: string;
  maxDisplay?: number;
}

export function MultiSelect({
  options,
  value = [],
  onChange,
  placeholder = '请选择',
  searchable = false,
  disabled = false,
  className,
  maxDisplay = 3,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedOptions = options.filter(o => value.includes(o.value));
  const filtered = search
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open && searchable && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open, searchable]);

  const toggleOption = useCallback((optValue: string) => {
    const newValue = value.includes(optValue)
      ? value.filter(v => v !== optValue)
      : [...value, optValue];
    onChange?.(newValue);
  }, [value, onChange]);

  const removeOption = useCallback((e: React.MouseEvent, optValue: string) => {
    e.stopPropagation();
    onChange?.(value.filter(v => v !== optValue));
  }, [value, onChange]);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { if (!disabled) { setOpen(!open); setSearch(''); } }}
        className={cn(
          'flex w-full items-center justify-between gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 min-h-9 transition-colors',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-muted-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary/30',
          open && 'border-primary ring-1 ring-primary/30'
        )}
      >
        <div className="flex flex-wrap gap-1 flex-1">
          {selectedOptions.length === 0 ? (
            <span className="text-sm text-muted-foreground">{placeholder}</span>
          ) : (
            <>
              {selectedOptions.slice(0, maxDisplay).map(opt => (
                <span
                  key={opt.value}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs"
                >
                  {opt.label}
                  {!disabled && (
                    <X
                      className="w-3 h-3 hover:text-primary/70 transition-colors cursor-pointer"
                      onClick={(e) => removeOption(e, opt.value)}
                    />
                  )}
                </span>
              ))}
              {selectedOptions.length > maxDisplay && (
                <span className="text-xs text-muted-foreground px-1 py-0.5">
                  +{selectedOptions.length - maxDisplay}
                </span>
              )}
            </>
          )}
        </div>
        <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform shrink-0', open && 'rotate-180')} />
      </button>

      {/* Dropdown - z-[10000] to appear above Modal */}
      {open && (
        <div className="absolute z-[10000] mt-1 w-full rounded-lg border border-border bg-popover shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100">
          {searchable && (
            <div className="p-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  ref={searchRef}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="搜索..."
                  className="w-full h-8 pl-8 pr-3 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          )}
          <div className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-6 text-center text-muted-foreground text-sm">无匹配选项</div>
            ) : (
              filtered.map(opt => {
                const isSelected = value.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleOption(opt.value)}
                    disabled={opt.disabled}
                    className={cn(
                      'flex w-full items-center justify-between px-3 py-2 text-sm transition-colors',
                      opt.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                      isSelected
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground hover:bg-muted'
                    )}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && <Check className="w-4 h-4 shrink-0 text-primary" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
