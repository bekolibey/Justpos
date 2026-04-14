import { createReferenceNo } from './ids';

export type PosProgressState = 'BAGLANTI' | 'BEKLEME';

export interface PosSimulationResult {
  ok: boolean;
  processedAt: string;
  referenceNo?: string;
  errorCode?: string;
}

interface SimulatePosOptions {
  onProgress?: (state: PosProgressState) => void;
  successRate?: number;
}

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });

export const simulatePosPayment = async (options?: SimulatePosOptions): Promise<PosSimulationResult> => {
  const successRate = options?.successRate ?? 0.8;

  options?.onProgress?.('BAGLANTI');
  await wait(900);

  options?.onProgress?.('BEKLEME');
  await wait(1_050);

  const isSuccessful = Math.random() <= successRate;

  if (isSuccessful) {
    return {
      ok: true,
      processedAt: new Date().toISOString(),
      referenceNo: createReferenceNo(),
    };
  }

  return {
    ok: false,
    processedAt: new Date().toISOString(),
    errorCode: `POS-${Math.floor(40 + Math.random() * 30)}`,
  };
};
