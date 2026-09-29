'use client';
import { Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export function FileDrop({ onFiles, accept, label, hint, compact = false, disabled }: { onFiles: (files: File[]) => void; accept?: string; label?: string; hint?: string; compact?: boolean; disabled?: boolean }) {
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={() => !disabled && input.current?.click()}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          input.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (disabled) return;
        const files = Array.from(e.dataTransfer.files);
        if (files.length) onFiles(files);
      }}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed text-center transition-colors',
        compact ? 'px-3 py-3' : 'px-4 py-7',
        over ? 'border-green-600 bg-green-50' : 'border-[#c7d3d2] bg-bg hover:border-green-500 hover:bg-green-50/60',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <Upload className={cn('text-green-600', compact ? 'size-4' : 'mb-1.5 size-6')} aria-hidden />
      <span className="text-sm font-medium text-ink">{label ?? 'Drop a file here or click to browse'}</span>
      {hint && <span className="mt-0.5 text-xs text-ink-2">{hint}</span>}
      <input
        ref={input}
        type="file"
        className="hidden"
        accept={accept}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onFiles(files);
          e.target.value = '';
        }}
      />
    </div>
  );
}

export async function readTextIfPossible(file: File): Promise<string | undefined> {
  if (/\.(txt|md|json)$/i.test(file.name) || file.type.startsWith('text/')) {
    try {
      return await file.text();
    } catch {
      return undefined;
    }
  }
  return undefined;
}
