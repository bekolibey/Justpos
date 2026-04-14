import { AlertCircle, UserRound } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { PaymentPanel } from '../../components/payment/PaymentPanel';
import { PaymentStatusModal } from '../../components/payment/PaymentStatusModal';
import { SplitPaymentEditor } from '../../components/payment/SplitPaymentEditor';
import { AppButton } from '../../components/ui/AppButton';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { appRoutes } from '../../constants/routes';
import { startMockPosFlow } from '../../services/pos/mockPosFlow';
import { usePOS } from '../../state/POSContext';
import type { PaymentType, SplitPaymentPart } from '../../types/pos';
import { formatCurrency } from '../../utils/currency';
import { createCashReferenceNo, createSplitPartId } from '../../utils/ids';
import { calculateTotals } from '../../utils/order';

const createSplitParts = (totalAmount: number, count: 2 | 3): SplitPaymentPart[] => {
  const totalKurus = Math.round(totalAmount * 100);
  const baseKurus = Math.floor(totalKurus / count);
  const remainder = totalKurus % count;

  return Array.from({ length: count }, (_, index) => {
    const amountKurus = baseKurus + (index < remainder ? 1 : 0);

    return {
      id: createSplitPartId(),
      amount: amountKurus / 100,
      method: index % 2 === 0 ? 'KART' : 'NAKIT',
      paid: false,
    };
  });
};

export const PaymentPageDesktop = () => {
  const navigate = useNavigate();
  const { tableId } = useParams<{ tableId: string }>();
  const {
    tables,
    terminals,
    waiters,
    createTransaction,
    markTableAsPaid,
    markTableAsPaymentWaiting,
    closeTable,
    pushToast,
  } = usePOS();

  const table = useMemo(() => tables.find((item) => item.id === tableId), [tableId, tables]);
  const activeTableId = table?.id ?? tableId ?? '';
  const totals = useMemo(
    () =>
      calculateTotals(table?.orderItems ?? [], {
        guestCount: table?.guestCount,
        coverEnabled: table?.coverEnabled,
        coverPerGuest: table?.coverPerGuest,
      }),
    [table?.coverEnabled, table?.coverPerGuest, table?.guestCount, table?.orderItems],
  );

  const [selectedTerminalId, setSelectedTerminalId] = useState('');
  const [selectedWaiterName, setSelectedWaiterName] = useState('');
  const [paymentType, setPaymentType] = useState<PaymentType>('KART');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingStep, setLoadingStep] = useState<'BAGLANTI' | 'BEKLEME'>('BAGLANTI');
  const [modalMode, setModalMode] = useState<'hidden' | 'loading' | 'success' | 'error'>('hidden');
  const [successData, setSuccessData] = useState<{
    referenceNo: string;
    terminalNo: string;
    processedAt: string;
    amount: number;
  } | null>(null);
  const [errorCode, setErrorCode] = useState('POS-00');
  const [splitParts, setSplitParts] = useState<SplitPaymentPart[]>(() => createSplitParts(totals.grandTotal, 2));
  const [processingPartId, setProcessingPartId] = useState<string | null>(null);

  const terminalInfo = useMemo(
    () => terminals.find((terminal) => terminal.id === selectedTerminalId),
    [selectedTerminalId, terminals],
  );
  const paymentWaiterName = useMemo(() => selectedWaiterName.trim(), [selectedWaiterName]);

  const splitSummary = useMemo(() => {
    const plannedTotal = splitParts.reduce((sum, part) => sum + part.amount, 0);
    const paidTotal = splitParts.filter((part) => part.paid).reduce((sum, part) => sum + part.amount, 0);
    const remaining = Number(Math.max(0, totals.grandTotal - paidTotal).toFixed(2));
    const difference = Number((totals.grandTotal - plannedTotal).toFixed(2));
    const completed = remaining <= 0.01 && Math.abs(difference) <= 0.01 && splitParts.every((part) => part.paid);

    return {
      remaining,
      completed,
    };
  }, [splitParts, totals.grandTotal]);

  useEffect(() => {
    if (!selectedTerminalId && terminals.length > 0) {
      const firstActiveTerminal = terminals.find((terminal) => terminal.isActive) ?? terminals[0];
      setSelectedTerminalId(firstActiveTerminal.id);
    }
  }, [selectedTerminalId, terminals]);

  useEffect(() => {
    if (waiters.length === 0) {
      setSelectedWaiterName('');
      return;
    }

    setSelectedWaiterName((current) => {
      if (current && waiters.includes(current)) {
        return current;
      }

      const tableWaiterName = table?.waiterName?.trim();
      if (tableWaiterName && waiters.includes(tableWaiterName)) {
        return tableWaiterName;
      }

      return waiters[0];
    });
  }, [table?.waiterName, waiters]);

  useEffect(() => {
    setSplitParts((current) => createSplitParts(totals.grandTotal, current.length === 3 ? 3 : 2));
  }, [totals.grandTotal]);

  useEffect(() => {
    if (!table || paymentType !== 'BOLUNMUS') {
      return;
    }

    if (splitSummary.completed && table.status !== 'ODENDI') {
      markTableAsPaid(table.id);
      pushToast('Bölünmüş ödeme tamamlandı.', 'success');
    }
  }, [markTableAsPaid, paymentType, pushToast, splitSummary.completed, table]);

  const ensurePaymentWaiterSelected = useCallback(() => {
    if (!paymentWaiterName) {
      pushToast('Ödemeyi alan garson seçimi zorunludur.', 'error');
      return false;
    }

    return true;
  }, [paymentWaiterName, pushToast]);

  const setSplitPartPaid = useCallback((partId: string) => {
    setSplitParts((parts) => parts.map((part) => (part.id === partId ? { ...part, paid: true } : part)));
  }, []);

  const navigateBackToOrder = useCallback(() => {
    if (!activeTableId) {
      return;
    }

    navigate(appRoutes.adisyon(activeTableId));
  }, [activeTableId, navigate]);

  const closeTableAndNavigate = useCallback(() => {
    if (!activeTableId) {
      return;
    }

    closeTable(activeTableId);
    pushToast('Masa kapatıldı ve adisyon sıfırlandı.', 'success');
    navigate(appRoutes.tables);
  }, [activeTableId, closeTable, navigate, pushToast]);

  const runCardPayment = useCallback(async () => {
    if (!table || !activeTableId) {
      return;
    }

    if (!ensurePaymentWaiterSelected()) {
      return;
    }

    markTableAsPaymentWaiting(activeTableId);
    setIsSubmitting(true);
    setModalMode('loading');
    setLoadingStep('BAGLANTI');

    const result = await startMockPosFlow({
      onProgress: (step) => {
        setLoadingStep(step);
      },
    });

    if (result.ok) {
      const transaction = createTransaction({
        tableId: activeTableId,
        terminalId: selectedTerminalId,
        waiterName: paymentWaiterName,
        paymentType: 'KART',
        amount: totals.grandTotal,
        status: 'BASARILI',
        referenceNo: result.referenceNo,
      });

      if (transaction) {
        markTableAsPaid(activeTableId);
        setSuccessData({
          referenceNo: transaction.referenceNo ?? '-',
          terminalNo: transaction.terminalNo,
          processedAt: transaction.createdAt,
          amount: transaction.amount,
        });
        setModalMode('success');
        pushToast('Kart tahsilatı başarıyla alındı.', 'success');
      } else {
        setErrorCode('POS-TERM');
        setModalMode('error');
      }
    } else {
      createTransaction({
        tableId: activeTableId,
        terminalId: selectedTerminalId,
        waiterName: paymentWaiterName,
        paymentType: 'KART',
        amount: totals.grandTotal,
        status: 'BASARISIZ',
        errorCode: result.errorCode,
      });

      setErrorCode(result.errorCode);
      setModalMode('error');
      pushToast('Kart işlemi başarısız oldu.', 'error');
    }

    setIsSubmitting(false);
  }, [
    activeTableId,
    createTransaction,
    ensurePaymentWaiterSelected,
    markTableAsPaid,
    markTableAsPaymentWaiting,
    paymentWaiterName,
    pushToast,
    selectedTerminalId,
    table,
    totals.grandTotal,
  ]);

  const runCashPayment = useCallback(() => {
    if (!activeTableId) {
      return;
    }

    if (!ensurePaymentWaiterSelected()) {
      return;
    }

    const cashReference = createCashReferenceNo();
    const transaction = createTransaction({
      tableId: activeTableId,
      terminalId: selectedTerminalId,
      waiterName: paymentWaiterName,
      paymentType: 'NAKIT',
      amount: totals.grandTotal,
      status: 'BASARILI',
      referenceNo: cashReference,
    });

    if (!transaction) {
      pushToast('Terminal bilgisi doğrulanamadı.', 'error');
      return;
    }

    markTableAsPaid(activeTableId);
    setSuccessData({
      referenceNo: cashReference,
      terminalNo: transaction.terminalNo,
      processedAt: transaction.createdAt,
      amount: transaction.amount,
    });
    setModalMode('success');
    pushToast('Nakit tahsilat kaydı oluşturuldu.', 'success');
  }, [
    activeTableId,
    createTransaction,
    ensurePaymentWaiterSelected,
    markTableAsPaid,
    paymentWaiterName,
    pushToast,
    selectedTerminalId,
    totals.grandTotal,
  ]);

  const handleSubmit = useCallback(async () => {
    if (!selectedTerminalId) {
      pushToast('Terminal seçimi zorunludur.', 'error');
      return;
    }

    if (!ensurePaymentWaiterSelected()) {
      return;
    }

    if (paymentType === 'BOLUNMUS') {
      pushToast('Bölünmüş ödeme için satır aksiyonlarını kullanın.', 'info');
      return;
    }

    if (paymentType === 'NAKIT') {
      runCashPayment();
      return;
    }

    await runCardPayment();
  }, [ensurePaymentWaiterSelected, paymentType, pushToast, runCardPayment, runCashPayment, selectedTerminalId]);

  const handleSendSplitCard = useCallback(
    async (partId: string) => {
      if (!selectedTerminalId) {
        pushToast('Terminal seçimi zorunludur.', 'error');
        return;
      }

      if (!activeTableId) {
        return;
      }

      if (!ensurePaymentWaiterSelected()) {
        return;
      }

      const targetPart = splitParts.find((part) => part.id === partId);
      if (!targetPart || targetPart.paid || targetPart.amount <= 0) {
        return;
      }

      markTableAsPaymentWaiting(activeTableId);
      setProcessingPartId(partId);

      const result = await startMockPosFlow();

      if (result.ok) {
        createTransaction({
          tableId: activeTableId,
          terminalId: selectedTerminalId,
          waiterName: paymentWaiterName,
          paymentType: 'BOLUNMUS',
          splitMethod: 'KART',
          amount: targetPart.amount,
          status: 'BASARILI',
          referenceNo: result.referenceNo,
        });

        setSplitPartPaid(partId);
        pushToast(`Parça kart ödemesi tamamlandı (${formatCurrency(targetPart.amount)}).`, 'success');
      } else {
        createTransaction({
          tableId: activeTableId,
          terminalId: selectedTerminalId,
          waiterName: paymentWaiterName,
          paymentType: 'BOLUNMUS',
          splitMethod: 'KART',
          amount: targetPart.amount,
          status: 'BASARISIZ',
          errorCode: result.errorCode,
        });

        pushToast(`Parça kart ödemesi başarısız (${result.errorCode}).`, 'error');
      }

      setProcessingPartId(null);
    },
    [
      activeTableId,
      createTransaction,
      ensurePaymentWaiterSelected,
      markTableAsPaymentWaiting,
      paymentWaiterName,
      pushToast,
      selectedTerminalId,
      setSplitPartPaid,
      splitParts,
    ],
  );

  const handleMarkSplitCash = useCallback(
    (partId: string) => {
      if (!selectedTerminalId) {
        pushToast('Terminal seçimi zorunludur.', 'error');
        return;
      }

      if (!activeTableId) {
        return;
      }

      if (!ensurePaymentWaiterSelected()) {
        return;
      }

      const targetPart = splitParts.find((part) => part.id === partId);
      if (!targetPart || targetPart.paid || targetPart.amount <= 0) {
        return;
      }

      createTransaction({
        tableId: activeTableId,
        terminalId: selectedTerminalId,
        waiterName: paymentWaiterName,
        paymentType: 'BOLUNMUS',
        splitMethod: 'NAKIT',
        amount: targetPart.amount,
        status: 'BASARILI',
        referenceNo: createCashReferenceNo(),
      });

      setSplitPartPaid(partId);
      pushToast(`Parça nakit tahsilatı kaydedildi (${formatCurrency(targetPart.amount)}).`, 'success');
    },
    [
      activeTableId,
      createTransaction,
      ensurePaymentWaiterSelected,
      paymentWaiterName,
      pushToast,
      selectedTerminalId,
      setSplitPartPaid,
      splitParts,
    ],
  );

  const handleSplitCountChange = useCallback(
    (count: 2 | 3) => {
      setSplitParts(createSplitParts(totals.grandTotal, count));
    },
    [totals.grandTotal],
  );

  const handleSplitAmountChange = useCallback((partId: string, amount: number) => {
    setSplitParts((parts) =>
      parts.map((part) =>
        part.id === partId
          ? {
              ...part,
              amount: Number(Math.max(0, amount).toFixed(2)),
            }
          : part,
      ),
    );
  }, []);

  const handleSplitMethodChange = useCallback((partId: string, method: 'NAKIT' | 'KART') => {
    setSplitParts((parts) =>
      parts.map((part) =>
        part.id === partId
          ? {
              ...part,
              method,
            }
          : part,
      ),
    );
  }, []);

  if (!table) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Ödeme kaydı bulunamadı</h2>
        <p className="mt-1 text-sm text-slate-500">İlgili masa için adisyon bulunamadı.</p>
      </section>
    );
  }

  if (totals.grandTotal <= 0) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Tahsil edilecek tutar bulunamadı</h2>
        <p className="mt-1 text-sm text-slate-500">Aktif satır olmadığından ödeme başlatılamaz.</p>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Ödemeler - Masa {table.number}</h2>
            <p className="text-sm text-slate-500">Durum: <StatusBadge variant="table" value={table.status} /></p>
          </div>

          <AppButton variant="ghost" size="sm" onClick={navigateBackToOrder}>
            Adisyona Geri Dön
          </AppButton>
        </div>

        <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          <UserRound size={16} className="text-[#7A5B00]" />
          <span>Hesabı Alan Garson:</span>
          <strong className="text-slate-900">{paymentWaiterName || 'Atanmadı'}</strong>
        </div>
      </section>

      <PaymentPanel
        tableNo={table.number}
        adisyonNo={table.adisyonNo ?? '-'}
        terminals={terminals}
        selectedTerminalId={selectedTerminalId}
        onChangeTerminal={setSelectedTerminalId}
        waiters={waiters}
        selectedWaiterName={selectedWaiterName}
        onChangeWaiter={setSelectedWaiterName}
        subtotal={totals.subtotal}
        serviceFee={totals.serviceFee}
        coverCharge={totals.coverCharge}
        grandTotal={totals.grandTotal}
        paymentType={paymentType}
        onSelectPaymentType={setPaymentType}
        onSubmit={() => {
          void handleSubmit();
        }}
        onCancel={navigateBackToOrder}
        isSubmitting={isSubmitting}
        submitDisabled={paymentType === 'BOLUNMUS'}
        splitSection={
          paymentType === 'BOLUNMUS' ? (
            <SplitPaymentEditor
              totalAmount={totals.grandTotal}
              parts={splitParts}
              processingPartId={processingPartId}
              onSplitCountChange={handleSplitCountChange}
              onAmountChange={handleSplitAmountChange}
              onMethodChange={handleSplitMethodChange}
              onSendCardPart={(partId) => {
                void handleSendSplitCard(partId);
              }}
              onMarkCashPart={handleMarkSplitCash}
            />
          ) : undefined
        }
      />

      {paymentType === 'BOLUNMUS' ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start gap-2 text-sm text-slate-600">
            <AlertCircle size={16} className="mt-0.5" />
            <p>
              Bölünmüş Ödeme modunda kart parçalarını satırdan POS’a gönderin, nakit parçaları manuel işaretleyin.
              Kalan Tutar: <strong>{formatCurrency(splitSummary.remaining)}</strong>
            </p>
          </div>

          {splitSummary.completed ? (
            <AppButton className="mt-4" onClick={closeTableAndNavigate}>
              Masa Kapat
            </AppButton>
          ) : (
            <p className="mt-3 text-xs text-slate-500">Toplam plan ve ödenen tutar eşitlendiğinde Masa Kapat aktif olur.</p>
          )}
        </section>
      ) : null}

      <PaymentStatusModal
        open={modalMode !== 'hidden'}
        mode={modalMode === 'hidden' ? 'loading' : modalMode}
        loadingStep={loadingStep}
        successData={successData ?? undefined}
        errorData={modalMode === 'error' ? { errorCode } : undefined}
        onCloseSuccess={() => {
          setModalMode('hidden');
          closeTableAndNavigate();
        }}
        onRetry={() => {
          setModalMode('hidden');
          void runCardPayment();
        }}
        onBackToOrder={() => {
          setModalMode('hidden');
          navigateBackToOrder();
        }}
      />

      {terminalInfo && !terminalInfo.isActive ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
          Seçili terminal pasif durumda görünüyor. Test akışı için farklı terminal seçebilirsiniz.
        </p>
      ) : null}
    </div>
  );
};
