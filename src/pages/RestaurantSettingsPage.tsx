import { Cloud, Database, KeyRound, RefreshCcw, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';

import { AppButton } from '../components/ui/AppButton';
import { AppCard } from '../components/ui/AppCard';
import { AppInput, FieldLabel } from '../components/ui/FormField';
import { PageHeader } from '../components/ui/PageHeader';
import { usePOS } from '../state/POSContext';
import {
  clearCloudRuntimeConfig,
  getCloudRuntimeConfig,
  saveCloudRuntimeConfig,
  testCloudConnection,
} from '../services/cloud/supabaseClient';

const settingBlocks = [
  {
    title: 'İş Yeri Bilgileri',
    description: 'Unvan, vergi bilgisi, adres ve iletişim kayıtları',
  },
  {
    title: 'Terminal Eşleştirme',
    description: 'Terminal no, salon atamaları, aktif/pasif yönetimi',
  },
  {
    title: 'Kullanıcı Yönetimi',
    description: 'Kasiyer ve operasyon kullanıcıları için erişim tanımları',
  },
  {
    title: 'Rol ve Yetki Ayarları',
    description: 'Yetki şablonları, işlem onay adımları ve limitler',
  },
  {
    title: 'Yazıcı Ayarları',
    description: 'Adisyon yazıcı seçimi, kopya adedi ve format tercihleri',
  },
  {
    title: 'Tema / Görünüm',
    description: 'Kurumsal renk paleti, layout modu ve panel görünüm seçenekleri',
  },
];

export const RestaurantSettingsPage = () => {
  const { cloudStatus, forceCloudSync, pushToast } = usePOS();
  const currentConfig = useMemo(() => getCloudRuntimeConfig(), []);

  const [supabaseUrl, setSupabaseUrl] = useState(currentConfig?.url ?? '');
  const [anonKey, setAnonKey] = useState(currentConfig?.anonKey ?? '');
  const [tableName, setTableName] = useState(currentConfig?.tableName ?? 'pos_snapshots');
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const maskedKey = useMemo(() => {
    if (!currentConfig?.anonKey) {
      return 'Henüz girilmedi';
    }

    return `${currentConfig.anonKey.slice(0, 10)}...${currentConfig.anonKey.slice(-6)}`;
  }, [currentConfig?.anonKey]);

  return (
    <div className="space-y-4">
      <AppCard>
        <PageHeader
          title="Ayarlar"
          description="Cloud bağlantısı, entegrasyon ve operasyon ayarlarını buradan yönetebilirsiniz."
        />
      </AppCard>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_0.85fr]">
        <AppCard className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Cloud Veritabanı Bağlantısı</h3>
              <p className="mt-1 text-sm text-slate-500">Supabase bilgilerini buraya girince uygulama local yerine cloud senkron kullanır.</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              <Cloud size={14} />
              {currentConfig ? 'Bağlı' : 'Hazır'}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5 sm:col-span-2">
              <FieldLabel label="Supabase Project URL" />
              <AppInput
                value={supabaseUrl}
                onChange={(event) => setSupabaseUrl(event.target.value)}
                placeholder="https://ornekproje.supabase.co"
              />
            </label>

            <label className="space-y-1.5 sm:col-span-2">
              <FieldLabel label="Anon Public Key" />
              <AppInput
                type="password"
                value={anonKey}
                onChange={(event) => setAnonKey(event.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              />
            </label>

            <label className="space-y-1.5">
              <FieldLabel label="Eski Snapshot Tablosu" />
              <AppInput
                value={tableName}
                onChange={(event) => setTableName(event.target.value)}
                placeholder="pos_snapshots"
              />
            </label>

            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
              <p className="font-semibold text-slate-900">Bulacağın yer</p>
              <p className="mt-1">Supabase Panel {'>'} Project Settings {'>'} API</p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <AppButton
              variant="secondary"
              onClick={async () => {
                try {
                  setIsTesting(true);
                  saveCloudRuntimeConfig({
                    url: supabaseUrl,
                    anonKey,
                    tableName,
                  });
                  await testCloudConnection();
                  pushToast('Supabase bağlantısı doğrulandı.', 'success');
                } catch (error) {
                  const message = error instanceof Error ? error.message : 'Bağlantı doğrulanamadı.';
                  pushToast(message, 'error');
                } finally {
                  setIsTesting(false);
                }
              }}
              disabled={isTesting || isSaving}
            >
              <Database size={14} />
              {isTesting ? 'Test Ediliyor' : 'Bağlantıyı Test Et'}
            </AppButton>

            <AppButton
              onClick={async () => {
                try {
                  setIsSaving(true);
                  saveCloudRuntimeConfig({
                    url: supabaseUrl,
                    anonKey,
                    tableName,
                  });
                  pushToast('Cloud ayarı kaydedildi. Uygulama yenileniyor.', 'success');
                  window.setTimeout(() => window.location.reload(), 500);
                } catch (error) {
                  const message = error instanceof Error ? error.message : 'Ayar kaydedilemedi.';
                  pushToast(message, 'error');
                } finally {
                  setIsSaving(false);
                }
              }}
              disabled={isTesting || isSaving}
            >
              <ShieldCheck size={14} />
              {isSaving ? 'Kaydediliyor' : 'Kaydet ve Yenile'}
            </AppButton>

            <AppButton
              variant="ghost"
              onClick={() => {
                clearCloudRuntimeConfig();
                pushToast('Cloud ayarı temizlendi. Local mod aktif.', 'info');
                window.setTimeout(() => window.location.reload(), 350);
              }}
              disabled={isTesting || isSaving}
            >
              <RefreshCcw size={14} />
              Temizle
            </AppButton>
          </div>
        </AppCard>

        <AppCard className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Mevcut Durum</h3>
            <p className="mt-1 text-sm text-slate-500">Aktif bağlantı bilgisi ve hızlı kurulum özeti.</p>
          </div>

          <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
            <p className="flex items-center justify-between gap-3">
              <span className="text-slate-500">Bağlantı</span>
              <strong className="text-slate-900">{currentConfig ? 'Supabase aktif' : 'Local mod'}</strong>
            </p>
            <p className="flex items-center justify-between gap-3">
              <span className="text-slate-500">Hydration</span>
              <strong className="text-slate-900">{cloudStatus.hydrationState}</strong>
            </p>
            <p className="flex items-center justify-between gap-3">
              <span className="text-slate-500">Senkron</span>
              <strong className="text-slate-900">{cloudStatus.syncState}</strong>
            </p>
            <p className="flex items-center justify-between gap-3">
              <span className="text-slate-500">URL</span>
              <strong className="max-w-[220px] truncate text-right text-slate-900">{currentConfig?.url ?? '-'}</strong>
            </p>
            <p className="flex items-center justify-between gap-3">
              <span className="text-slate-500">Key</span>
              <strong className="max-w-[220px] truncate text-right text-slate-900">{maskedKey}</strong>
            </p>
            <p className="flex items-center justify-between gap-3">
              <span className="text-slate-500">Legacy Snapshot</span>
              <strong className="text-slate-900">{currentConfig?.tableName ?? 'pos_snapshots'}</strong>
            </p>
            <p className="flex items-center justify-between gap-3">
              <span className="text-slate-500">Son Sync</span>
              <strong className="max-w-[220px] truncate text-right text-slate-900">
                {cloudStatus.lastSyncedAt ? new Date(cloudStatus.lastSyncedAt).toLocaleString('tr-TR') : '-'}
              </strong>
            </p>
          </div>

          {cloudStatus.lastError ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <p className="font-semibold">Cloud uyarısı</p>
              <p className="mt-1">{cloudStatus.lastError}</p>
            </div>
          ) : null}

          {cloudStatus.missingTables.length > 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <p className="font-semibold">Eksik tablolar</p>
              <div className="mt-2 space-y-1">
                {cloudStatus.missingTables.map((tableName) => (
                  <p key={tableName} className="font-mono text-xs">{tableName}</p>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-lg border border-[#E9C44A]/40 bg-[#FFF8DE] p-3 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">Kurulum adımı</p>
            <p className="mt-1">Önce Supabase içindeki `SQL Editor` bölümünde `supabase/schema.sql` dosyasını çalıştır.</p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-600">
            <p className="flex items-center gap-2 font-semibold text-slate-900">
              <KeyRound size={14} />
              API bilgilerini bulma yolu
            </p>
            <p className="mt-2">Supabase Dashboard {'>'} Project Settings {'>'} API</p>
            <p className="mt-1">`Project URL` alanını URL kısmına, `anon public` alanını da key kısmına gir.</p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">Oluşacak tablolar</p>
            <p className="mt-2 font-mono text-xs">pos_workspaces</p>
            <p className="mt-1 font-mono text-xs">pos_waiters</p>
            <p className="mt-1 font-mono text-xs">pos_terminals</p>
            <p className="mt-1 font-mono text-xs">pos_menu_items</p>
            <p className="mt-1 font-mono text-xs">pos_modifier_groups</p>
            <p className="mt-1 font-mono text-xs">pos_modifier_options</p>
            <p className="mt-1 font-mono text-xs">pos_tables</p>
            <p className="mt-1 font-mono text-xs">pos_order_items</p>
            <p className="mt-1 font-mono text-xs">pos_order_item_modifiers</p>
            <p className="mt-1 font-mono text-xs">pos_order_audit_logs</p>
            <p className="mt-1 font-mono text-xs">pos_transactions</p>
          </div>

          <AppButton
            className="w-full"
            onClick={async () => {
              const result = await forceCloudSync();
              pushToast(result.message, result.ok ? 'success' : 'error');
            }}
            disabled={!currentConfig}
          >
            Cloud Senkronu Zorla
          </AppButton>
        </AppCard>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        {settingBlocks.map((block) => (
          <AppCard key={block.title}>
            <h3 className="text-sm font-semibold text-slate-900">{block.title}</h3>
            <p className="mt-1 text-sm text-slate-500">{block.description}</p>
          </AppCard>
        ))}
      </section>
    </div>
  );
};
