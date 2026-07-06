'use client';

import { ClipboardCopy } from 'lucide-react';

import { getDiagnosticReport, sendDiagnosticReport } from '@/lib/logger/client';

const diagEnabled = process.env.NEXT_PUBLIC_DIAG_ENABLED === 'true';

export const isDiagnosticEnabled = diagEnabled;

async function copyDiagnostic() {
  const report = getDiagnosticReport();
  try {
    await navigator.clipboard.writeText(report);
  } catch {
  }
  void sendDiagnosticReport();
}

type CopyDiagnosticButtonProps = {
  className?: string;
};

export function CopyDiagnosticButton({ className }: CopyDiagnosticButtonProps) {
  if (!diagEnabled) return null;

  return (
    <button
      type="button"
      onClick={() => void copyDiagnostic()}
      className={
        className ??
        'flex items-center gap-1 text-xs text-zinc-400 hover:text-white'
      }
    >
      <ClipboardCopy className="h-3 w-3" />
      העתק אבחון
    </button>
  );
}
