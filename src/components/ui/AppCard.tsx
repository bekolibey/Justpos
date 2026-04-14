import type { PropsWithChildren } from 'react';

import { cn } from '../../utils/cn';

interface AppCardProps extends PropsWithChildren {
  className?: string;
  tone?: 'default' | 'muted' | 'highlight';
}

const toneClassMap: Record<NonNullable<AppCardProps['tone']>, string> = {
  default: 'border-slate-200/90 bg-white/95 backdrop-blur',
  muted: 'border-slate-200 bg-slate-50/95 backdrop-blur',
  highlight: 'border-[#E9C44A]/50 bg-[linear-gradient(180deg,#FFF8DE_0%,#FFF3CC_100%)]',
};

export const AppCard = ({ className, tone = 'default', children }: AppCardProps) => (
  <section
    className={cn(
      'rounded-2xl border p-4 shadow-sm shadow-slate-200/70 transition-shadow hover:shadow-md hover:shadow-slate-200/70',
      toneClassMap[tone],
      className,
    )}
  >
    {children}
  </section>
);
