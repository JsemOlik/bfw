import { Head, Link as InertiaLink } from '@inertiajs/react';

interface Props {
    link: {
        original_url: string;
        slug: string;
        created_at: string;
        expires_at: string;
        is_expired: boolean;
    };
}

export default function Status({ link }: Props) {
    const shortUrl = `${window.location.origin}/link/${link.slug}`;

    return (
        <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-6">
            <Head title={`Status: ${link.slug}`} />
            
            <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-br from-orange-500 to-red-600 p-8 text-white">
                    <h1 className="text-2xl font-bold mb-1">Link Status</h1>
                    <p className="text-orange-100 text-sm">Details for slug: <span className="font-mono bg-white/10 px-2 py-0.5 rounded italic">{link.slug}</span></p>
                </div>

                <div className="p-8 space-y-6">
                    <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Original Destination</label>
                        <div className="text-gray-900 break-all font-medium text-lg leading-relaxed">
                            {link.original_url}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Shortened Link</label>
                        <div className="flex items-center gap-3">
                            <input 
                                readOnly 
                                value={shortUrl} 
                                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono text-gray-700"
                            />
                            <button 
                                onClick={() => navigator.clipboard.writeText(shortUrl)}
                                className="bg-orange-500 text-white px-5 py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20 active:scale-95"
                            >
                                Copy
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 pt-6 border-t border-gray-100">
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Created At</label>
                            <div className="text-gray-800 text-sm">{new Date(link.created_at).toLocaleString()}</div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Expires At</label>
                            <div className={`text-sm font-semibold ${link.is_expired ? 'text-red-500' : 'text-green-600'}`}>
                                {new Date(link.expires_at).toLocaleString()}
                                {link.is_expired && <span className="ml-2 bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] uppercase">Expired</span>}
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 flex gap-4">
                        <InertiaLink 
                            href="/links" 
                            className="flex-1 text-center py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                        >
                            All Links
                        </InertiaLink>
                        <InertiaLink 
                            href="/" 
                            className="flex-1 text-center py-3 bg-gray-900 hover:bg-black text-white rounded-xl font-semibold transition-colors shadow-xl shadow-black/10"
                        >
                            Back Home
                        </InertiaLink>
                    </div>
                </div>
            </div>
        </div>
    );
}
