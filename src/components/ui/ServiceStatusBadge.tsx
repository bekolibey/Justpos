import type { ServiceStatus } from '../../types/pos';
import { SERVICE_STATUS_LABELS } from '../../utils/labels';

interface ServiceStatusBadgeProps {
  value: ServiceStatus;
}

const serviceStatusStyles: Record<ServiceStatus, string> = {
  BEKLIYOR: 'border border-slate-200 bg-slate-100 text-slate-600',
  MUTFAKTA: 'border border-sky-200 bg-sky-50 text-sky-700',
  HAZIR: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
  SERVISTE: 'border border-violet-200 bg-violet-50 text-violet-700',
};

export const ServiceStatusBadge = ({ value }: ServiceStatusBadgeProps) => (
  <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${serviceStatusStyles[value]}`}>
    {SERVICE_STATUS_LABELS[value]}
  </span>
);
