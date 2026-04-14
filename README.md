# JustPOS - Restoran POS Prototipi

Restoran/kafe operasyonu için geliştirilmiş, kurumsal görünümlü adisyon + ödeme + mobil POS akışı prototipi.
Uygulama hem masaüstü merchant paneli hem de `5.0"` Android POS / telefon kullanımına uygun kompakt arayüz içerir.

## Teknoloji

- React
- TypeScript
- Vite
- Tailwind CSS
- lucide-react
- React Router
- Capacitor (Android)
- Supabase

## Öne Çıkan Özellikler

- Login ekranı (`/login`) ve korumalı route yapısı
- Çift arayüz desteği
  - Masaüstü merchant paneli
  - `5.0"` POS ve telefonlar için kompakt mobil sürüm
- 12 masalı operasyon ekranı (`/masalar`)
  - Masa no arama ve durum filtreleri (Tümü/Boş/Dolu/Ödeme Bekliyor/Ödendi)
  - Masa birleştir
  - Masa taşı
  - Masa ayır (oran bazlı)
  - Hızlı ödeme yönlendirmesi
  - Masa bazlı servis aşaması rozeti
- Masa operasyonları ekranı (`/masa-operasyonlari`)
  - Sol menüden erişim
  - Birleştir / Taşı / Ayır işlemlerinin tek panelden yönetimi
- Ürün yönetimi ekranı (`/urun-yonetimi`)
  - Sol menüden erişim
  - Menüye yeni ürün ekleme
  - Favori ürünleri yıldızlama
- Adisyon yönetimi (`/adisyon/:tableId`)
  - Ürün arama
  - Kategori filtreleme
  - 1 Porsiyon / 1.5 Porsiyon ürün ekleme
  - Favori ürünler
  - Son seçilen ürünler
  - Hızlı giden ürünler
  - Seçenekli ekleme: modifier + seat + not
  - Satır bazlı seat değişimi
  - Satır ikram + neden zorunluluğu
  - İşlemi geri alma
  - Satır logları (audit trail)
  - Adet artır/azalt
  - Servis aşaması yönetimi: Bekliyor / Mutfakta / Hazır / Serviste
  - Anlık ara toplam/hizmet bedeli/genel toplam
- Ödeme ekranı (`/odeme/:tableId`)
  - Nakit, kart, bölünmüş ödeme
  - Kuver (kişi başı) dahil toplam hesaplama
  - Tahsil edilecek tutarın USD/EUR karşılığı
  - Hesabı alan garson görünümü
  - **VakıfBank POS’a Gönder** mock akışı
  - POS loading/success/error state
  - Split payment (2/3 parça, satır bazlı POS/manuel tahsilat)
- İşlem geçmişi (`/islem-gecmisi`)
  - Tarih, masa, durum, ödeme tipi, terminal filtreleri
  - Satır detay modalı
  - Tam iade / kısmi iade akışı
- Raporlar (`/raporlar`)
  - Günlük ciro
  - Kart/nakit tahsilat
  - Başarısız işlem sayısı
  - Masa ve terminal dağılım görselleştirmesi
- Ayarlar (`/ayarlar`) kurumsal placeholder ekranı
  - Runtime Supabase bağlantı ayarı
  - Cloud bağlantı testi
  - Eksik tablo ve son sync durumu görünümü

## Bu Projede Sonradan Eklenenler

- Mobil POS odaklı kullanım iyileştirmeleri
  - Daha büyük dokunma alanları
  - Kutucuk tipinde kategori seçimi
  - Ürünlerde hızlı ekleme akışı
  - Alt sabit hızlı aksiyon alanları
- Garson hız modu
  - Favoriler
  - Son seçilenler
  - Hızlı gidenler
  - Hızlı ödeme geçişleri
- Masa operasyonları
  - Birleştir / taşı / ayır akışı
  - Servis aşamasının masa üstünde görünmesi
- Finansal akışlar
  - Kuver aç/kapat
  - Garson bazlı ödeme alma takibi
  - Bölünmüş ödeme
  - Tam ve kısmi iade
- Cloud backend hazırlığı
  - Supabase ile ilişkisel tablo yapısı
  - Cloud senkron durumu
  - Local mod fallback
- Android hazırlığı
  - Capacitor entegrasyonu
  - Canlı cihaz testi
  - Debug APK üretimi

## Kurulum ve Çalıştırma

```bash
npm install
npm run dev
```

Ardından tarayıcıda Vite çıktısındaki adresi açın (genelde `http://localhost:5173`).

## Cloud Database (Supabase)

Uygulama artık local state yanında opsiyonel Supabase cloud senkron desteği içerir.

En hızlı yöntem:
- Uygulamada `Ayarlar` ekranını açın
- `Cloud Veritabanı Bağlantısı` bölümüne `Project URL` ve `Anon/Public Key` girin
- `Bağlantıyı Test Et` ardından `Kaydet ve Yenile` seçin

Kullanılan ana cloud tabloları:
- `pos_workspaces`
- `pos_waiters`
- `pos_terminals`
- `pos_menu_items`
- `pos_modifier_groups`
- `pos_modifier_options`
- `pos_tables`
- `pos_order_items`
- `pos_order_item_modifiers`
- `pos_order_audit_logs`
- `pos_transactions`

Legacy uyumluluk için:
- `pos_snapshots`

### 1) Supabase tablo kurulumunu çalıştırın

Supabase SQL Editor içinde şu dosyayı çalıştırın:

- `supabase/schema.sql`

### 2) Ortam değişkenlerini tanımlayın

`.env.example` dosyasını kopyalayıp `.env` oluşturun:

```bash
cp .env.example .env
```

Ardından değerleri doldurun:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_STATE_TABLE` (opsiyonel, varsayılan `pos_snapshots`)

### 3) Uygulamayı yeniden başlatın

```bash
npm run dev
```

Not:
- Env değerleri yoksa uygulama otomatik olarak local-only modda çalışır.
- Env değerleri varsa masa/menü/işlem verileri iş yeri koduna göre ilişkisel Supabase tablolarına senkronlanır.
- Eski `pos_snapshots` tablosu varsa uygulama ilk okumada onu da görebilir ve yeni tablolara geçişte kullanır.

## Demo Giriş Bilgisi

- Kullanıcı Adı: `operator`
- Şifre: `123456`
- İş Yeri: formdan seçilebilir

## Build

```bash
npm run build
```

## Mobil Uygulama (Android)

Proje Capacitor ile native Android uygulama olarak paketlenebilir.

Mobil sürümde öne çıkanlar:
- kompakt masa listesi
- garson için hızlı adisyon akışı
- favori ürünler ve hızlı seçim alanları
- servis durumu takibi
- telefon ve Android POS cihazlarda canlı test akışı

İlk kurulum:

```bash
npm install
npm run android:add
```

Web build + Android senkron:

```bash
npm run android:sync
```

Android Studio aç:

```bash
npm run android:open
```

Canlı geliştirme (aynı ağdan cihaz ile):

```bash
npm run android:run:live
```

Debug APK üret:

```bash
npm run android:apk:debug
```

Bağlı cihaza/emülatöre debug APK kur:

```bash
npm run android:install:debug
```

Release çıktıları (unsigned APK + AAB):

```bash
npm run android:release
```

Çıktı dosyaları:

- `android/app/build/outputs/apk/debug/app-debug.apk`
- `android/app/build/outputs/apk/release/app-release-unsigned.apk`
- `android/app/build/outputs/bundle/release/app-release.aab`

Oluşan native proje dizini:

- `android/`
- `capacitor.config.ts`

## Proje Yapısı (Özet)

```text
src/
  components/
    layout/            # Sidebar, Header, ana layout, sağ özet panel
    tables/            # Masa kartları ve grid
    menu/              # Ürün kartı ve kategori filtreleri
    payment/           # Adisyon özeti, ödeme paneli, POS modal, split editör
    history/           # İşlem tablosu ve detay modalı
    reports/           # Dashboard kartları ve basit grafik blokları
    ui/                # StatusBadge, toast ve boş durum bileşenleri
  data/                # Menü, masa, terminal, kullanıcı ve örnek transaction verileri
  services/cloud/      # Supabase client + cloud snapshot read/write servisleri
  pages/               # Login, Masalar, Adisyon, Ödeme, Geçmiş, Raporlar, Ayarlar
    desktop/           # Normal ekran versiyonu
    compact/           # 5.0" POS uyumlu kompakt versiyon
  state/               # POSContext (auth + masa + ödeme + transaction state)
  types/               # TypeScript tipleri (`src/types/pos.ts`)
  utils/               # Para/tarih/hesaplama/id/POS/transaction yardımcıları
```

## Önemli Dosyalar

- `src/state/POSContext.tsx`: Uygulamanın merkezi state katmanı
- `src/services/cloud/cloudState.ts`: İlişkisel cloud veri oku/yaz ve legacy snapshot geçiş katmanı
- `src/services/cloud/supabaseClient.ts`: Supabase bağlantı katmanı
- `src/pages/PaymentPage.tsx`: POS mock akışı ve split payment mantığı
- `src/pages/AdisyonPage.tsx`: Masa sipariş yönetimi
- `src/pages/compact/AdisyonPageCompact.tsx`: 5.0" POS odaklı hızlı sipariş ekranı
- `src/pages/compact/TablesPageCompact.tsx`: mobil masa operasyon ekranı
- `src/pages/TransactionHistoryPage.tsx`: Filtreli işlem geçmişi
- `src/components/tables/TableOperationsPanel.tsx`: Masa birleştir/taşı/ayır paneli
- `src/components/tables/TableCard.tsx`: Referans alınan masa kartı düzeni
- `src/components/menu/QuickPickSection.tsx`: favori / son seçilen / hızlı giden ürün alanları
- `src/components/ui/ServiceStatusBadge.tsx`: servis aşaması rozeti
- `src/components/layout/MainLayout.tsx`: Sol menü + üst header + sağ panel ana iskeleti
