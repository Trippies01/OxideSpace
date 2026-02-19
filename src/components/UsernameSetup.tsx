import React, { useState } from 'react';
import { useProfile } from '../hooks/useSupabase';
import { Loader2, User, AlertCircle } from 'lucide-react';

const USERNAME_MIN = 2;
const USERNAME_MAX = 32;
const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

function randomDiscriminator(): string {
  return String(1000 + Math.floor(Math.random() * 9000));
}

export default function UsernameSetup({ onDone }: { onDone: () => void }) {
  const { updateProfile } = useProfile();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = username.trim();
    if (trimmed.length < USERNAME_MIN) {
      setError(`Kullanıcı adı en az ${USERNAME_MIN} karakter olmalı.`);
      return;
    }
    if (trimmed.length > USERNAME_MAX) {
      setError(`Kullanıcı adı en fazla ${USERNAME_MAX} karakter olmalı.`);
      return;
    }
    if (!USERNAME_REGEX.test(trimmed)) {
      setError('Sadece harf, rakam ve alt çizgi (_) kullanabilirsin.');
      return;
    }

    setLoading(true);
    try {
      const discriminator = randomDiscriminator();
      await updateProfile({ username: trimmed, discriminator });
      onDone();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Kullanıcı adı kaydedilemedi.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-orange-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-red-600/20 rounded-full blur-[120px]" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex justify-center p-1 bg-white/5 rounded-3xl border border-white/5 mb-6 shadow-2xl shadow-orange-500/5">
            <img src="/logo.png" alt="OxideSpace" className="w-14 h-14 rounded-2xl object-cover" />
          </div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
            Oxide<span className="text-orange-500">Space</span>
          </h1>
          <p className="text-zinc-500">Sadece kullanıcı adını gir; etiket (#1234) sana otomatik atanır.</p>
        </div>

        <div className="backdrop-blur-xl bg-[#121217]/80 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Kullanıcı adı (etiket sistem tarafından atanır)</label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 text-zinc-500" size={18} />
                <input
                  type="text"
                  required
                  minLength={USERNAME_MIN}
                  maxLength={USERNAME_MAX}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="kullanici_adi"
                  className="w-full bg-black/40 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all placeholder:text-zinc-700"
                />
              </div>
              <p className="text-xs text-zinc-500 ml-1">
                {USERNAME_MIN}-{USERNAME_MAX} karakter, sadece harf, rakam ve _
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Devam'}
            </button>
          </form>
        </div>

        <p className="text-center text-zinc-700 text-xs mt-6">
          Etiket (#1234) otomatik atanır; ileride Premium ile özelleştirilebilecek.
        </p>
      </div>
    </div>
  );
}
