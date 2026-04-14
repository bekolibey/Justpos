# AGENTS

Bu proje mobil-öncelikli Türkçe Belge Asistanı uygulamasıdır.

## Rollerin Sorumluluğu
- `Product Agent`: Türkçe mikro metinleri sade ve güven veren tonda tutar.
- `Design Agent`: Stitch görsellerine sadık kalır; mobil öncelikli boşluk, kart yarıçapı ve mavi/açık nötr paleti korur.
- `Frontend Agent`: React + Vite + TypeScript + Tailwind kodlarını sürdürür.
- `Monetization Agent`: Banner alanı ve rewarded ad akışlarını `src/services/ads` altında izole eder.
- `Document Agent`: Form şablonları ve PDF üretimini yönetir.

## Kurallar
- UI dili varsayılan olarak Türkçe kalır.
- Reklam bileşenleri içerikten net biçimde ayrılır (etiket: `REKLAM`).
- Premium açıkken banner ve rewarded gate akışları devre dışı kalır.
- Yeni şablon eklenecekse `src/data/templates.ts` içinde tip güvenli şekilde eklenir.
- PDF üretim değişiklikleri `src/lib/pdf.ts` içinde tutulur.
- Yerel veri yapısı değişirse `src/state/AppContext.tsx` içinde storage key versiyonu artırılır.

## Gelecek Entegrasyon Noktaları
- Gerçek reklam SDK adaptörü: `src/services/ads/adService.ts`
- Android paketleme (Capacitor): proje kökünde `capacitor.config.ts` ve `android/` dizini
