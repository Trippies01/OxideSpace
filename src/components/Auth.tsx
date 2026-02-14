
import React, { useState, useMemo } from 'react';
import { useAuth } from '../hooks/useSupabase';
import { Loader2, Zap, Mail, Lock, AlertCircle, ArrowLeft } from 'lucide-react';
import { PASSWORD_MIN_LENGTH } from '../constants';

function getAuthErrorMessage(err: unknown): string {
    if (!err || typeof err !== 'object') return 'Bir hata oluştu.';
    const e = err as { message?: string; status?: number };
    const msg = (e.message || '').toLowerCase();
    if (msg.includes('invalid login') || msg.includes('invalid_credentials')) return 'E-posta veya şifre hatalı.';
    if (msg.includes('email not confirmed')) return 'E-posta adresinizi doğrulayın. Gelen kutunuzu kontrol edin.';
    if (msg.includes('user already registered') || msg.includes('already registered')) return 'Bu e-posta adresi zaten kayıtlı. Giriş yapın.';
    if (msg.includes('password') && msg.includes('weak')) return 'Şifre yeterince güçlü değil. En az 8 karakter, büyük/küçük harf ve rakam kullanın.';
    if (msg.includes('rate limit') || msg.includes('too many')) return 'Çok fazla deneme. Lütfen biraz sonra tekrar deneyin.';
    if (msg.includes('network') || msg.includes('fetch')) return 'Bağlantı hatası. İnternet bağlantınızı kontrol edin.';
    return (e as { message?: string }).message || 'Bir hata oluştu.';
}

function getPasswordStrength(password: string): { score: number; label: string; valid: boolean } {
    if (!password.length) return { score: 0, label: '', valid: false };
    let score = 0;
    if (password.length >= PASSWORD_MIN_LENGTH) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    if (password.length >= 12) score++;
    const labels = ['Zayıf', 'Orta', 'İyi', 'Güçlü', 'Çok güçlü'];
    const valid = password.length >= PASSWORD_MIN_LENGTH && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password);
    return { score: Math.min(score, 5), label: labels[Math.min(score - 1, 4)] || '', valid };
}

export default function Auth({ onLogin }: { onLogin: () => void }) {
    const [isLogin, setIsLogin] = useState(true);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const { signIn, signUp, resetPasswordForEmail } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);
    const canSignUp = useMemo(
        () => passwordStrength.valid && email.trim().length > 0,
        [passwordStrength.valid, email]
    );

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            if (isLogin) {
                await signIn(email, password);
                onLogin();
            } else {
                if (!passwordStrength.valid) {
                    setError('Şifre en az 8 karakter, büyük harf, küçük harf ve rakam içermelidir.');
                    setLoading(false);
                    return;
                }
                const data = await signUp(email, password);
                if (data.user && !data.session) {
                    setSuccessMessage('E-posta adresinize doğrulama linki gönderdik. Giriş yapmak için e-postanızdaki linke tıklayın.');
                    setPassword('');
                } else {
                    onLogin();
                }
            }
        } catch (err) {
            setError(getAuthErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) {
            setError('E-posta adresinizi girin.');
            return;
        }
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            await resetPasswordForEmail(email.trim());
            setSuccessMessage('Şifre sıfırlama linki e-posta adresinize gönderildi. Gelen kutunuzu kontrol edin.');
        } catch (err) {
            setError(getAuthErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const resetState = () => {
        setError(null);
        setSuccessMessage(null);
        setShowForgotPassword(false);
    };

    if (showForgotPassword) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-orange-600/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-red-600/20 rounded-full blur-[120px]" />
                <div className="w-full max-w-md relative z-10">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-3xl border border-white/5 mb-6">
                            <Zap size={40} className="text-orange-500" fill="currentColor" fillOpacity={0.2} />
                        </div>
                        <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Oxide<span className="text-orange-500">Space</span></h1>
                        <p className="text-zinc-500">Şifre sıfırlama</p>
                    </div>
                    <div className="backdrop-blur-xl bg-[#121217]/80 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                        <form onSubmit={handleForgotPassword} className="space-y-4">
                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}
                            {successMessage && (
                                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">
                                    {successMessage}
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-zinc-500 uppercase ml-1">E-posta</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3.5 text-zinc-500" size={18} />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="ornek@oxide.space"
                                        className="w-full bg-black/40 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-orange-500/50"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : 'Sıfırlama linki gönder'}
                            </button>
                            <button
                                type="button"
                                onClick={() => { setShowForgotPassword(false); resetState(); }}
                                className="w-full flex items-center justify-center gap-2 py-2.5 text-zinc-400 hover:text-white transition-colors"
                            >
                                <ArrowLeft size={18} /> Girişe dön
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-orange-600/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-red-600/20 rounded-full blur-[120px]" />

            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-3xl border border-white/5 mb-6 shadow-2xl shadow-orange-500/5">
                        <Zap size={40} className="text-orange-500" fill="currentColor" fillOpacity={0.2} />
                    </div>
                    <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Oxide<span className="text-orange-500">Space</span></h1>
                    <p className="text-zinc-500">Dijital evrenine giriş yap.</p>
                </div>

                <div className="backdrop-blur-xl bg-[#121217]/80 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

                    <form onSubmit={handleAuth} className="space-y-4 relative z-10">
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}
                        {successMessage && (
                            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">
                                {successMessage}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-zinc-500 uppercase ml-1">E-posta</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3.5 text-zinc-500" size={18} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); resetState(); }}
                                    placeholder="ornek@oxide.space"
                                    className="w-full bg-black/40 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all placeholder:text-zinc-700"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Şifre</label>
                                {isLogin && (
                                    <button
                                        type="button"
                                        onClick={() => { setShowForgotPassword(true); resetState(); }}
                                        className="text-xs text-orange-500 hover:text-orange-400"
                                    >
                                        Şifremi unuttum
                                    </button>
                                )}
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3.5 text-zinc-500" size={18} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); resetState(); }}
                                    placeholder="••••••••"
                                    minLength={isLogin ? undefined : PASSWORD_MIN_LENGTH}
                                    className="w-full bg-black/40 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all placeholder:text-zinc-700"
                                />
                            </div>
                            {!isLogin && password.length > 0 && (
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="flex gap-0.5 flex-1">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <div
                                                key={i}
                                                className={`h-1 flex-1 rounded-full ${i <= passwordStrength.score ? 'bg-orange-500' : 'bg-white/10'}`}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-xs text-zinc-500">{passwordStrength.label}</span>
                                </div>
                            )}
                            {!isLogin && (
                                <p className="text-xs text-zinc-500 mt-0.5">
                                    En az {PASSWORD_MIN_LENGTH} karakter, büyük harf, küçük harf ve rakam.
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || (!isLogin && !canSignUp)}
                            className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : (isLogin ? 'Giriş Yap' : 'Kayıt Ol')}
                        </button>
                    </form>

                    <div className="mt-6 flex flex-col items-center gap-4">
                        <div className="w-full h-px bg-white/5" />
                        <p className="text-zinc-500 text-sm">
                            {isLogin ? 'Hesabın yok mu?' : 'Zaten hesabın var mı?'}{' '}
                            <button
                                type="button"
                                onClick={() => { setIsLogin(!isLogin); resetState(); setPassword(''); }}
                                className="text-orange-500 hover:text-orange-400 font-bold transition-colors"
                            >
                                {isLogin ? 'Kayıt Ol' : 'Giriş Yap'}
                            </button>
                        </p>
                    </div>
                </div>

                <p className="text-center text-zinc-700 text-xs mt-8">
                    Devam ederek <a href="#" className="underline hover:text-zinc-500">Hizmet Şartları</a>'nı kabul etmiş olursun.
                </p>
            </div>
        </div>
    );
}
