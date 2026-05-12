import React, { useEffect, useState } from 'react';
import AdminSidebar from './AdminSidebar';
import { getPendingFacultyVerifications, approveFacultyVerification, rejectFacultyVerification } from '../../services/adminService';
import { StarDecoration } from '../icons';

// Icons
const Icons = {
  Doc: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
  Check: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>,
  X: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>,
  Undo: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>,
};

export default function AdminFacultyVerifications() {
  const [verifications, setVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getPendingFacultyVerifications();
      
      const payload = res as any;
      let itemsList = [];
      
      if (Array.isArray(payload)) itemsList = payload;
      else if (Array.isArray(payload?.data)) itemsList = payload.data;
      else if (Array.isArray(payload?.requests)) itemsList = payload.requests;
      else if (payload?.data && Array.isArray(payload.data.requests)) itemsList = payload.data.requests;
      
      setVerifications(itemsList);
    } catch (error) {
      console.error("Fetch error", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    const actionText = action === 'approve' ? 'approve' : 'reject';
    if (!window.confirm(`Are you sure you want to ${actionText} this faculty verification?`)) return;
    try {
      if (action === 'approve') {
        await approveFacultyVerification(id);
      } else {
        await rejectFacultyVerification(id);
      }
      loadData(); // Refresh
    } catch (error) {
      alert("Action failed");
    }
  };

  return (
    <div className="flex min-h-screen bg-transparent relative">
      <AdminSidebar />
      
      {/* Main Content Area - Fluid full width layout */}
      <div className="flex-1 relative min-h-screen w-full px-6 lg:px-10 py-8">
        
        {/* Decorative Background Elements */}
        <div className="absolute top-12 left-12 z-0 opacity-10 pointer-events-none">
          <StarDecoration className="w-32 h-32" color="#0B9C2C" />
        </div>

        {/* Content Wrapper */}
        <div className="relative z-10 w-full">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-4xl font-bold text-dreamxec-navy font-display flex items-center gap-3">
                Faculty Verifications <StarDecoration className="w-8 h-8 hidden sm:block" color="#FF7F00" />
              </h1>
              <p className="text-gray-600 mt-2 font-sans text-lg">Review faculty IDs and approve requests.</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border-4 border-dreamxec-navy shadow-pastel-card overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-gray-500 animate-pulse font-bold font-display text-xl">Loading data...</div>
            ) : verifications.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-6xl mb-4">👩‍🏫</div>
                <h3 className="text-2xl font-bold text-dreamxec-navy font-display">No Pending Requests</h3>
                <p className="text-gray-500 font-sans mt-2">All caught up! No faculty verifications pending.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-dreamxec-cream border-b-2 border-dreamxec-navy/20">
                    <tr>
                      <th className="p-5 font-bold tracking-wider font-display uppercase text-sm text-dreamxec-navy">User</th>
                      <th className="p-5 font-bold tracking-wider font-display uppercase text-sm text-dreamxec-navy">Institutional Email</th>
                      <th className="p-5 font-bold tracking-wider font-display uppercase text-sm text-dreamxec-navy">ID Card</th>
                      <th className="p-5 font-bold tracking-wider font-display uppercase text-sm text-dreamxec-navy">Status</th>
                      <th className="p-5 text-right font-bold tracking-wider font-display uppercase text-sm text-dreamxec-navy">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {verifications.map((v: any) => (
                      <tr key={v.id} className="hover:bg-dreamxec-cream/50 transition-colors">
                        <td className="p-5">
                          <div className="font-bold text-dreamxec-navy text-lg font-display">{v.user?.name || 'Unknown'}</div>
                          <div className="text-sm text-gray-500 font-mono mt-1">{v.user?.email}</div>
                        </td>
                        <td className="p-5 text-sm font-mono text-gray-600">
                          {v.institutionalEmail}
                        </td>
                        <td className="p-5">
                          {v.facultyIdCardUrl ? (
                            <a 
                              href={v.facultyIdCardUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border-2 border-dreamxec-orange rounded-full text-xs font-bold text-dreamxec-orange shadow-sm hover:bg-dreamxec-orange hover:text-white transition-colors"
                            >
                              <Icons.Doc /> View ID
                            </a>
                          ) : (
                            <span className="text-gray-400 italic">No document</span>
                          )}
                        </td>
                        <td className="p-5">
                          <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase border-2 shadow-sm ${
                            v.status === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-200' :
                            v.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                            'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            {v.status}
                          </span>
                        </td>
                        <td className="p-5 text-right">
                          {v.status === 'PENDING' && (
                            <div className="flex justify-end gap-3 items-center">
                              <button 
                                onClick={() => handleAction(v.id, 'approve')}
                                className="p-2.5 bg-green-50 text-green-700 rounded-lg border-2 border-green-200 shadow-sm hover:bg-green-100 transition-colors"
                                title="Approve"
                              >
                                <Icons.Check />
                              </button>
                              <button 
                                onClick={() => handleAction(v.id, 'reject')}
                                className="p-2.5 bg-red-50 text-red-700 rounded-lg border-2 border-red-200 shadow-sm hover:bg-red-100 transition-colors"
                                title="Reject"
                              >
                                <Icons.X />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
