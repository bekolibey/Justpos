import { AlertTriangle, CheckCircle2, LoaderCircle } from 'lucide-react';

import { formatCurrency } from '../../utils/currency';
import { formatDateTime } from '../../utils/date';
import { AppButton } from '../ui/AppButton';

interface SuccessData {
  referenceNo: string;
  terminalNo: string;
  processedAt: string;
  amount: number;
}

interface ErrorData {
  errorCode: string;
}

interface PaymentStatusModalProps {
  open: boolean;
  mode: 'loading' | 'success' | 'error';
  loadingStep?: 'BAGLANTI' | 'BEKLEME';
  successData?: SuccessData;
  errorData?: ErrorData;
  onCloseSuccess: () => void;
  onRetry: () => void;
  onBackToOrder: () => void;
}

export const PaymentStatusModal = ({
  open,
  mode,
  loadingStep,
  successData,
  errorData,
  onCloseSuccess,
  onRetry,
  onBackToOrder,
}: PaymentStatusModalProps) => {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        {mode === 'loading' ? (
          <div className="text-center">
            <LoaderCircle className="mx-auto animate-spin text-[#D7AD2E]" size={36} />
            <h3 className="mt-3 text-lg font-semibold text-slate-900">POS ile Bağlantı Kuruluyor</h3>
            <p className="mt-1 text-sm text-slate-500">{loadingStep === 'BEKLEME' ? 'İşlem Bekleniyor' : 'Bağlantı başlatılıyor'}</p>
          </div>
        ) : null}

        {mode === 'success' && successData ? (
          <div>
            <div className="text-center">
              <CheckCircle2 className="mx-auto text-emerald-600" size={36} />
              <h3 className="mt-3 text-lg font-semibold text-slate-900">İşlem Başarılı</h3>
            </div>

            <div className="mt-4 space-y-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm">
              <p className="flex justify-between gap-4"><span>Referans No</span> <strong>{successData.referenceNo}</strong></p>
              <p className="flex justify-between gap-4"><span>Terminal No</span> <strong>{successData.terminalNo}</strong></p>
              <p className="flex justify-between gap-4"><span>Tarih Saat</span> <strong>{formatDateTime(successData.processedAt)}</strong></p>
              <p className="flex justify-between gap-4"><span>Tutar</span> <strong>{formatCurrency(successData.amount)}</strong></p>
            </div>

            <AppButton className="mt-4 w-full" onClick={onCloseSuccess}>
              Adisyonu Kapat
            </AppButton>
          </div>
        ) : null}

        {mode === 'error' && errorData ? (
          <div>
            <div className="text-center">
              <AlertTriangle className="mx-auto text-rose-600" size={36} />
              <h3 className="mt-3 text-lg font-semibold text-slate-900">İşlem Başarısız</h3>
              <p className="mt-1 text-sm text-slate-500">Hata Kodu: {errorData.errorCode}</p>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <AppButton onClick={onRetry}>
                Tekrar Dene
              </AppButton>
              <AppButton variant="ghost" onClick={onBackToOrder}>
                Adisyona Geri Dön
              </AppButton>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
