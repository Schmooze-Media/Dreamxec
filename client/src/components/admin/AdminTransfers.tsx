import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import Pagination from './Pagination';
import api from '../../services/api';
import { StarDecoration } from '../icons/StarDecoration';
import transferService from '../../services/transferService';

export default function AdminTransfers() {
    const [searchParams] = useSearchParams();
    const initialStatus = searchParams.get('status') || 'ALL';

    const [transfers, setTransfers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(initialStatus);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });

    useEffect(() => { fetchTransfers(); }, [activeTab, page]);

    const fetchTransfers = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: '20'
            });
            if (activeTab !== 'ALL') queryParams.append('status', activeTab);

            const res = await api.get<any>(`/admin/transfers?${queryParams.toString()}`);
            setTransfers(res.data?.transfers || []);
            setPagination({ totalPages: res.pages || 1, total: res.total || 0 });
        } catch (error) {
            console.error("Fetch error", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id: string, campaignId: string, action: 'approve' | 'reject') => {
        const notes = action === 'reject' ? prompt("Reason for rejection:") : prompt("Approval notes (optional):");
        if (action === 'reject' && !notes) return;
        if (!window.confirm(`Are you sure you want to ${action} this transfer?`)) return;

        try {
            if (action === 'approve') {
                await transferService.approveTransfer(campaignId, id, notes || '', 'ADMIN');
            } else {
                await transferService.rejectTransfer(campaignId, id, notes || '', 'ADMIN');
            }
            fetchTransfers();
        } catch (e: any) { 
            alert(e.response?.data?.message || `Failed to ${action} transfer`); 
        }
    };

    return (
        <div className="flex min-h-screen bg-transparent relative">
            <AdminSidebar />

            <div className="flex-1 relative min-h-screen w-full px-6 lg:px-10 py-8">
                <div className="relative z-10 w-full">

                    <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                        <div>
                            <h1 className="text-4xl font-bold text-dreamxec-navy font-display flex items-center gap-3">
                                Transfer Management <StarDecoration className="w-8 h-8" color="#FF7F00" />
                            </h1>
                        </div>

                        {/* TABS */}
                        <div className="flex flex-wrap gap-2 bg-white p-1.5 rounded-xl border-2 border-dreamxec-navy/20 shadow-sm">
                            {['ALL', 'PENDING_ADMIN', 'APPROVED', 'COMPLETED', 'REJECTED', 'EXPIRED'].map(tab => (
                                <button
                                    key={tab} onClick={() => { setActiveTab(tab); setPage(1); }}
                                    className={`px-5 py-2.5 rounded-lg font-bold text-xs transition-all shadow-sm ${activeTab === tab ? 'bg-dreamxec-navy text-white scale-105' : 'text-gray-500 hover:bg-gray-100'}`}
                                >
                                    {tab.replace('PENDING_ADMIN', 'PENDING')}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border-4 border-dreamxec-navy shadow-pastel-card overflow-hidden flex flex-col">
                        {loading ? (
                            <div className="p-12 text-center text-gray-500 font-bold font-display text-xl animate-pulse">Loading transfers...</div>
                        ) : (
                            <>
                                <div className="overflow-y-auto max-h-[650px] relative">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-dreamxec-cream border-b-2 border-dreamxec-navy/20 sticky top-0 z-20 shadow-sm">
                                            <tr>
                                                <th className="p-5 font-bold tracking-wider font-display uppercase text-sm text-dreamxec-navy">Date</th>
                                                <th className="p-5 font-bold tracking-wider font-display uppercase text-sm text-dreamxec-navy">Campaign</th>
                                                <th className="p-5 font-bold tracking-wider font-display uppercase text-sm text-dreamxec-navy">From User</th>
                                                <th className="p-5 font-bold tracking-wider font-display uppercase text-sm text-dreamxec-navy">To User</th>
                                                <th className="p-5 font-bold tracking-wider font-display uppercase text-sm text-dreamxec-navy">Status</th>
                                                <th className="p-5 text-right font-bold tracking-wider font-display uppercase text-sm text-dreamxec-navy">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {transfers.map((t: any) => (
                                                <tr key={t.id} className="hover:bg-dreamxec-cream/50 transition-colors">
                                                    <td className="p-5 text-sm text-gray-500 font-mono">{new Date(t.createdAt).toLocaleDateString()}</td>
                                                    <td className="p-5 font-bold text-dreamxec-navy">{t.campaign?.title}</td>
                                                    <td className="p-5 text-sm text-gray-700">{t.originalOwner?.name || t.originalOwner?.email}</td>
                                                    <td className="p-5 text-sm text-gray-700">{t.targetUser?.name || t.targetUser?.email}</td>
                                                    <td className="p-5">
                                                        <span className={`px-3 py-1 text-[10px] font-black tracking-wider uppercase rounded-lg border-2 ${t.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200' : t.status === 'PENDING_ADMIN' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : t.status === 'REJECTED' || t.status === 'EXPIRED' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                                                            {t.status.replace(/_/g, ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="p-5 text-right flex justify-end gap-2 items-center">
                                                        {t.status === 'PENDING_PRESIDENT' && (
                                                            <span className="text-[10px] font-black text-dreamxec-orange uppercase animate-pulse mr-2">Bypass</span>
                                                        )}
                                                        {(t.status === 'PENDING_ADMIN' || t.status === 'PENDING_PRESIDENT') && (
                                                            <>
                                                                <button onClick={() => handleAction(t.id, t.campaignId, 'approve')} className="px-3 py-1.5 bg-green-100 text-green-700 rounded border border-green-300 hover:bg-green-200 text-xs font-bold">Approve</button>
                                                                <button onClick={() => handleAction(t.id, t.campaignId, 'reject')} className="px-3 py-1.5 bg-red-100 text-red-700 rounded border border-red-300 hover:bg-red-200 text-xs font-bold">Reject</button>
                                                            </>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {transfers.length === 0 && (
                                                <tr>
                                                    <td colSpan={6} className="p-12 text-center text-gray-500 font-medium">No transfers found in this category.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {pagination.totalPages > 1 && (
                                    <Pagination page={page} totalPages={pagination.totalPages} setPage={setPage} />
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
