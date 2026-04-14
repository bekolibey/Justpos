import { LockKeyhole, Store, User as UserIcon } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { AppButton } from '../components/ui/AppButton';
import { appRoutes } from '../constants/routes';
import { MOCK_USER } from '../data/users';
import { usePOS } from '../state/POSContext';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, user } = usePOS();

  const [username, setUsername] = useState('operator');
  const [password, setPassword] = useState('123456');
  const [workplace, setWorkplace] = useState(MOCK_USER.workplaces[0]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      navigate(appRoutes.tables, { replace: true });
    }
  }, [navigate, user]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = login({ username, password, workplace });

    if (!result.ok) {
      setError(result.message ?? 'Giriş başarısız.');
      return;
    }

    setError(null);
    navigate(appRoutes.tables, { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#F4F5F8] via-[#F8F9FB] to-[#ECEFF4] px-4 py-6">
      <div className="w-full max-w-[460px] rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-6 rounded-2xl border border-[#E9C44A]/50 bg-[#FFF7D9] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7A5B00]">VakıfBank</p>
          <h1 className="mt-1 text-xl font-bold text-[#1F2229]">Restoran POS Yönetim Paneli</h1>
          <p className="mt-1 text-sm text-[#4A4F59]">Kurumsal adisyon ve POS yönlendirme ekranı</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">Kullanıcı Adı</span>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 focus-within:border-[#E9C44A]">
              <UserIcon size={16} className="text-slate-400" />
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full border-none bg-transparent text-sm text-slate-800 outline-none"
                placeholder="operator"
              />
            </div>
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">Şifre</span>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 focus-within:border-[#E9C44A]">
              <LockKeyhole size={16} className="text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full border-none bg-transparent text-sm text-slate-800 outline-none"
                placeholder="******"
              />
            </div>
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">İş Yeri Seçimi</span>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 focus-within:border-[#E9C44A]">
              <Store size={16} className="text-slate-400" />
              <select
                value={workplace}
                onChange={(event) => setWorkplace(event.target.value)}
                className="w-full border-none bg-transparent text-sm text-slate-800 outline-none"
              >
                {MOCK_USER.workplaces.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </label>

          {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

          <AppButton type="submit" className="w-full">
            Giriş Yap
          </AppButton>
        </form>

        <p className="mt-4 text-center text-xs text-slate-500">Demo şifresi: <strong>123456</strong></p>
      </div>
    </div>
  );
};
