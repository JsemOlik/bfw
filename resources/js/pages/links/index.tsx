import { Head, Link, useForm, usePage } from '@inertiajs/react';
import LinkController from '@/actions/App/Http/Controllers/LinkController';

interface LinkItem {
    id: number;
    original_url: string;
    slug: string;
    expires_at: string;
    user_id: number | null;
}

interface Props {
    links: LinkItem[];
}

export default function Index({ links }: Props) {
    const { auth } = usePage<any>().props;
    const { delete: destroy, processing } = useForm();

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete/expire this link?')) {
            destroy(LinkController.destroy(id).url, {
                preserveScroll: true,
            });
        }
    };

    return (
        <div className="min-h-screen bg-[#F3F4F6] p-6 lg:p-12">
            <Head title="All Shortened Links" />
            
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Shortened Links</h1>
                        <p className="text-gray-500 mt-1 uppercase text-xs font-bold tracking-widest">Public & Managed Links</p>
                    </div>
                    <div className="flex gap-3">
                        <Link 
                            href={LinkController.create().url} 
                            className="bg-[#f53003] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-red-500/20 hover:bg-[#e22c02] transition-all active:scale-95"
                        >
                            + Shorten New
                        </Link>
                        <Link 
                            href="/" 
                            className="bg-white text-gray-700 border border-gray-200 px-6 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all active:scale-95"
                        >
                            Back Home
                        </Link>
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden overflow-x-auto ring-1 ring-black/5">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Original Destination</th>
                                <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Shortened Slug</th>
                                <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Expires In</th>
                                <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {links.length > 0 ? links.map((link) => {
                                const isExpired = new Date(link.expires_at) < new Date();
                                const isOwner = auth.user && link.user_id === auth.user.id;
                                
                                return (
                                    <tr key={link.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="text-sm text-gray-900 font-medium max-w-xs truncate" title={link.original_url}>
                                                {link.original_url}
                                            </div>
                                            {isOwner && (
                                                <span className="inline-flex items-center gap-1 mt-1 text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-tighter ring-1 ring-blue-100">
                                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                                        <circle cx="12" cy="7" r="4"></circle>
                                                    </svg>
                                                    Your Link
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5">
                                            <Link 
                                                href={`/link/${link.slug}`} 
                                                className="inline-flex items-center gap-1.5 font-mono text-sm bg-gray-100 group-hover:bg-[#f53003]/10 text-gray-700 group-hover:text-[#f53003] px-3 py-1.5 rounded-lg transition-colors"
                                            >
                                                <span>/link/{link.slug}</span>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                                    <polyline points="15 3 21 3 21 9"></polyline>
                                                    <line x1="10" y1="14" x2="21" y2="3"></line>
                                                </svg>
                                            </Link>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            {isExpired ? (
                                                <span className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold uppercase ring-1 ring-red-100">Expired</span>
                                            ) : (
                                                <div className="text-xs font-bold text-gray-600 flex flex-col items-center">
                                                    <span>{new Date(link.expires_at).toLocaleDateString()}</span>
                                                    <span className="text-[10px] font-medium opacity-50 uppercase tracking-tighter">
                                                        {new Date(link.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link 
                                                    href={LinkController.status(link.slug).url} 
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-900 hover:text-white transition-all shadow-sm"
                                                    title="View Details"
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <circle cx="12" cy="12" r="10"></circle>
                                                        <line x1="12" y1="16" x2="12" y2="12"></line>
                                                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                                    </svg>
                                                </Link>
                                                {isOwner && (
                                                    <button
                                                        onClick={() => handleDelete(link.id)}
                                                        disabled={processing}
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm disabled:opacity-50"
                                                        title="Delete Link"
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="3 6 5 6 21 6"></polyline>
                                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
                                                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                                                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                                                </svg>
                                            </div>
                                            <p className="text-gray-500 font-medium">No shortened links found.</p>
                                            <Link href={LinkController.create().url} className="mt-4 text-[#f53003] font-bold hover:underline underline-offset-4">
                                                Create the first one →
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-gray-400 text-sm font-medium">
                        * Expired links are automatically removed from our servers after 24 hours.
                    </p>
                </div>
            </div>
        </div>
    );
}
