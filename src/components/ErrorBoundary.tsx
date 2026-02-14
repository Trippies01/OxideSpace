import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
            errorInfo: null,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        if (import.meta.env.DEV) console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({
            error,
            errorInfo,
        });
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen bg-black flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-[#121217] border border-red-500/20 rounded-2xl p-6 space-y-4">
                        <div className="flex items-center gap-3 text-red-400">
                            <AlertCircle size={24} />
                            <h2 className="text-xl font-bold">Bir hata oluştu</h2>
                        </div>
                        <p className="text-zinc-400 text-sm">
                            Uygulamada beklenmeyen bir hata meydana geldi. Lütfen sayfayı yenileyin veya tekrar deneyin.
                        </p>
                        {this.state.error && (
                            <details className="mt-4 p-3 bg-black/40 rounded-lg border border-white/5">
                                <summary className="text-xs text-zinc-500 cursor-pointer mb-2">Hata detayları</summary>
                                <pre className="text-xs text-red-400 overflow-auto max-h-40">
                                    {this.state.error.toString()}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </details>
                        )}
                        <button
                            onClick={this.handleReset}
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                        >
                            <RefreshCw size={18} />
                            Tekrar Dene
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl font-medium transition-colors"
                        >
                            Sayfayı Yenile
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
