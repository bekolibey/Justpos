export interface RewardedResult {
  rewarded: boolean;
}

export interface BannerContent {
  title: string;
  description: string;
  ctaLabel: string;
}

export type RewardedPlacement = 'preview_gate' | 'export_gate';

export interface AdService {
  showRewardedAd: (placement?: RewardedPlacement) => Promise<RewardedResult>;
  getBannerContent: () => BannerContent;
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

class LocalAdService implements AdService {
  async showRewardedAd() {
    await wait(2200);
    return { rewarded: true };
  }

  getBannerContent() {
    return {
      title: 'Belge Asistanı Premium',
      description: 'Reklamsız kullanım ve sınırsız şablon erişimi için Premium\'u deneyin.',
      ctaLabel: 'Planları Gör',
    };
  }
}

export const adService: AdService = new LocalAdService();
