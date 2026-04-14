import type { PosProgressState } from '../../utils/pos';
import { simulatePosPayment } from '../../utils/pos';

export interface MockPosSuccess {
  ok: true;
  referenceNo: string;
  processedAt: string;
}

export interface MockPosFailure {
  ok: false;
  errorCode: string;
  processedAt: string;
}

export type MockPosResult = MockPosSuccess | MockPosFailure;

interface StartMockPosFlowOptions {
  onProgress?: (state: PosProgressState) => void;
  successRate?: number;
}

export const startMockPosFlow = async (options?: StartMockPosFlowOptions): Promise<MockPosResult> => {
  const response = await simulatePosPayment(options);

  if (response.ok) {
    return {
      ok: true,
      referenceNo: response.referenceNo ?? 'VKF0000000000',
      processedAt: response.processedAt,
    };
  }

  return {
    ok: false,
    errorCode: response.errorCode ?? 'POS-00',
    processedAt: response.processedAt,
  };
};
