import type { ButtonHTMLAttributes } from 'react';

import { cn } from '../../utils/cn';

interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
}

const variantClassMap: Record<NonNullable<AppButtonProps['variant']>, string> = {
  primary: 'bg-[#E9C44A] text-[#1F2229] hover:bg-[#ddb73f] disabled:bg-slate-200 disabled:text-slate-500',
  secondary:
    'border border-[#E9C44A]/60 bg-[#FFF8DE] text-[#7A5B00] hover:bg-[#FFF3CC] disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400',
  ghost:
    'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400',
  danger:
    'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400',
};

const sizeClassMap: Record<NonNullable<AppButtonProps['size']>, string> = {
  sm: 'min-h-11 px-3 py-2 text-xs font-semibold',
  md: 'min-h-12 px-4 py-2.5 text-sm font-semibold',
};

export const AppButton = ({ className, variant = 'primary', size = 'md', type = 'button', ...props }: AppButtonProps) => (
  <button
    type={type}
    className={cn(
      'rounded-xl transition disabled:cursor-not-allowed disabled:opacity-90',
      variantClassMap[variant],
      sizeClassMap[size],
      className,
    )}
    {...props}
  />
);
