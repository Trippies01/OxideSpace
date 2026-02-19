
import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../hooks/useSupabase';
import { Loader2, Mail, Lock, AlertCircle, ArrowLeft } from 'lucide-react';
import { PASSWORD_MIN_LENGTH } from '../constants';

/** OAuth callback hatalarını URL'den okuyup kullanıcıya gösterir; URL'i temizler. */
function useOAuthCallbackError(setError: (s: string | null) => void) {
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const errorCode = params.get('error_code');
        const errorDesc = params.get('error_description') || '';
        if (params.get('error') && (errorCode === 'bad_oauth_state' || errorDesc.includes('state'))) {
            setError(
                'Google girişi zaman aşımına uğradı veya yönlendirme adresi uyuşmuyor. ' +
                'Supabase → Authentication → URL Configuration bölümünde Site URL ve Redirect URLs\'in bu uygulamanın adresiyle aynı olduğundan emin olun (ör. http://localhost:5173). Ardından tekrar deneyin.'
            );
            window.history.replaceState({}, '', window.location.pathname || '/');
        }
    }, [setError]);
}

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
    if (msg.includes('redirect_uri') || msg.includes('redirect uri')) return 'Google giriş ayarları hatalı. Lütfen site yöneticisiyle iletişime geçin.';
    if (msg.includes('access_denied') || msg.includes('popup_closed')) return 'Google ile giriş iptal edildi. Tekrar deneyebilirsiniz.';
    if (msg.includes('oauth') || msg.includes('google')) return 'Google ile giriş yapılamadı. Lütfen daha sonra tekrar deneyin.';
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
    const { signIn, signUp, signInWithGoogle, resetPasswordForEmail } = useAuth();

    useOAuthCallbackError(setError);

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

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            await signInWithGoogle();
        } catch (err) {
            setError(getAuthErrorMessage(err));
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
                        <div className="inline-flex items-center justify-center p-1 bg-white/5 rounded-3xl border border-white/5 mb-6">
                            <img src="/logo.png" alt="OxideSpace" className="w-14 h-14 rounded-2xl object-cover" />
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
                    <div className="inline-flex items-center justify-center p-1 bg-white/5 rounded-3xl border border-white/5 mb-6 shadow-2xl shadow-orange-500/5">
                        <img src="/logo.png" alt="OxideSpace" className="w-14 h-14 rounded-2xl object-cover" />
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

                        <div className="flex items-center gap-3 my-2">
                            <div className="flex-1 h-px bg-white/10" />
                            <span className="text-xs text-zinc-500">veya</span>
                            <div className="flex-1 h-px bg-white/10" />
                        </div>
                        <button
                            type="button"
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                            className="w-full bg-white/5 border border-white/10 text-white font-medium py-3 rounded-xl hover:bg-white/10 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            Google ile giriş yap
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
