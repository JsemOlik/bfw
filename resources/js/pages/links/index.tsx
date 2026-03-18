import { Head, Link as InertiaLink } from '@inertiajs/react';

interface LinkData {
    id: number;
    original_url: string;
    slug: string;
    expires_at: string;
    created_at: string;
}

interface Props {
    links: LinkData[];
}

export default function Index({ links }: Props) {
    return (
        <div className="min-h-screen bg-[#F3F4F6] p-8">
            <Head title="My Links" />
            
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Shortened Links</h1>
                    <InertiaLink 
                        href="/" 
                        className="px-4 py-2 bg-white rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-200"
                    >
                        Back to Home
                    </InertiaLink>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Original URL</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Short URL</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Expires At</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {links.map((link) => (
                                <tr key={link.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                                        <a href={link.original_url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                                            {link.original_url}
                                        </a>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                        {window.location.origin}/link/{link.slug}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(link.expires_at).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <InertiaLink 
                                            href={`/link/${link.slug}/status`}
                                            className="text-blue-600 hover:underline font-medium"
                                        >
                                            View Status
                                        </InertiaLink>
                                    </td>
                                </tr>
                            ))}
                            {links.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic">
                                        No links shortened yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
