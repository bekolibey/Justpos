import type { InputHTMLAttributes, SelectHTMLAttributes } from 'react';

import { cn } from '../../utils/cn';

interface FieldLabelProps {
  label: string;
  className?: string;
}

export const FieldLabel = ({ label, className }: FieldLabelProps) => (
  <span className={cn('text-sm font-medium text-slate-700', className)}>{label}</span>
);

interface AppInputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export const AppInput = ({ className, ...props }: AppInputProps) => (
  <input
    className={cn(
      'w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-800 outline-none transition focus:border-[#E9C44A]',
      className,
    )}
    {...props}
  />
);

interface AppSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  className?: string;
}

export const AppSelect = ({ className, ...props }: AppSelectProps) => (
  <select
    className={cn(
      'w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-800 outline-none transition focus:border-[#E9C44A]',
      className,
    )}
    {...props}
  />
);
