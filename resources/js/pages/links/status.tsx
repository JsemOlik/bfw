import { Head, Link as InertiaLink, useForm, usePage } from '@inertiajs/react';
import LinkController from '@/actions/App/Http/Controllers/LinkController';
import { useState, useEffect } from 'react';

interface Props {
    link: {
        id: number;
        user_id: number | null;
        original_url: string;
        slug: string;
        created_at: string;
        expires_at: string;
        is_expired: boolean;
    };
}

export default function Status({ link }: Props) {
    const { auth } = usePage<any>().props;
    const shortUrl = `${window.location.origin}/link/${link.slug}`;
    const [copied, setCopied] = useState(false);
    
    const { delete: destroy, processing } = useForm();
    const isOwner = auth.user && link.user_id === auth.user.id;

    useEffect(() => {
        if (copied) {
            const timeout = setTimeout(() => setCopied(false), 2000);
            return () => clearTimeout(timeout);
        }
    }, [copied]);

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete/expire this link?')) {
            destroy(LinkController.destroy(link.id).url);
        }
    };

    return (
        <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-6">
            <Head title={`Status: ${link.slug}`} />
            
            <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden ring-1 ring-black/5">
                <div className="bg-gradient-to-br from-[#f53003] via-[#ff4433] to-[#e22c02] p-8 text-white relative">
                    <div className="relative z-10">
                        <h1 className="text-2xl font-bold mb-1">Link Details</h1>
                        <p className="text-white/80 text-sm">Status for <span className="font-mono bg-black/10 px-2 py-0.5 rounded italic">/link/{link.slug}</span></p>
                    </div>
                    {isOwner && (
                        <div className="absolute top-8 right-8 z-10">
                            <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider backdrop-blur-sm ring-1 ring-white/30">
                                Your Link
                            </span>
                        </div>
                    )}
                </div>

                <div className="p-8 space-y-8">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-3">Original Destination</label>
                        <div className="text-gray-900 break-all font-semibold text-lg leading-snug">
                            {link.original_url}
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-3">Short Link</label>
                        <div className="flex items-center gap-3">
                            <input 
                                readOnly 
                                value={shortUrl} 
                                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-mono text-gray-700 focus:outline-none"
                            />
                            <button 
                                onClick={() => {
                                    navigator.clipboard.writeText(shortUrl);
                                    setCopied(true);
                                }}
                                className={`min-w-[110px] text-white px-5 py-3.5 rounded-xl font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 ${copied ? 'bg-green-500 shadow-green-500/20' : 'bg-gray-900 hover:bg-black shadow-black/10'}`}
                            >
                                {copied ? (
                                    <>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                        </svg>
                                        Copy
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 py-6 border-y border-gray-100">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">Created At</label>
                            <div className="text-gray-800 text-sm font-medium">{new Date(link.created_at).toLocaleString()}</div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">Expires At</label>
                            <div className={`text-sm font-bold flex items-center gap-2 ${link.is_expired ? 'text-red-500' : 'text-green-600'}`}>
                                {new Date(link.expires_at).toLocaleString()}
                                {link.is_expired && <span className="bg-red-50 px-1.5 py-0.5 rounded text-[10px] ring-1 ring-red-100">EXPIRED</span>}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-2">
                        <div className="flex-1 flex gap-4">
                            <InertiaLink 
                                href={LinkController.index().url} 
                                className="flex-1 text-center py-4 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-2xl font-bold transition-all border border-gray-100"
                            >
                                All Links
                            </InertiaLink>
                            <InertiaLink 
                                href="/" 
                                className="flex-1 text-center py-4 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-2xl font-bold transition-all border border-gray-100"
                            >
                                Home
                            </InertiaLink>
                        </div>
                        {isOwner && (
                            <button
                                onClick={handleDelete}
                                disabled={processing}
                                className="sm:w-auto w-full px-8 py-4 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-3 border border-red-100 disabled:opacity-50"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                                Delete/Expire
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
