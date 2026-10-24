import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Users, FileText, CheckCircle2, XCircle,
  AlertCircle, IndianRupee, Clock, Ban, Search, Award, ChevronDown, ChevronUp
} from 'lucide-react';
import { api } from '../api/client';
import Button from '../components/common/Button';
import PageHeader from '../components/common/PageHeader';
import StatusBadge from '../components/common/StatusBadge';
import VerificationBadge from '../components/common/VerificationBadge';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';

export default function AdminDashboard({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [verifications, setVerifications] = useState([]);
  const [jobRequests, setJobRequests] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Active Tab
  const [tab, setTab] = useState('verifications'); // 'verifications', 'requests', 'bookings'
  const [adminRemarks, setAdminRemarks] = useState({});
  const [expandedVerificationId, setExpandedVerificationId] = useState(null);

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [s, v, r, b] = await Promise.all([
        api.admin.stats(),
        api.admin.verifications(),
        api.jobRequests.list(),
        api.bookings.list()
      ]);
      setStats(s);
      setVerifications(v.results || v || []);
      setJobRequests(r.results || r || []);
      setBookings(b.results || b || []);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const handleVerify = async (workerId, decision) => {
    const remarks = adminRemarks[workerId] || (decision === 'APPROVE' ? 'Approved by admin' : 'Rejected by admin');
    setActionLoading(true);
    try {
      await api.admin.verifyWorker(workerId, decision, remarks);
      await loadAllAdminData();
    } catch (err) {
      alert(err.message || 'Failed to update verification status.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      <PageHeader
        title="Admin Control Center"
        subtitle="Manual worker verification, dispute oversight, and platform metrics."
      />

      {/* KPI METRICS OVERVIEW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-2xs">
          <div className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Total Users</div>
          <div className="text-2xl font-black text-[#172B2A] mt-1 font-heading">{stats?.total_users || 0}</div>
          <div className="text-[11px] text-[#64748B] mt-1">{stats?.total_workers || 0} registered workers</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-2xs">
          <div className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Pending Verifications</div>
          <div className="text-2xl font-black text-amber-600 mt-1 font-heading">{stats?.pending_verifications || 0}</div>
          <div className="text-[11px] text-amber-700 font-semibold mt-1">Requires admin review</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-2xs">
          <div className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Active Bookings</div>
          <div className="text-2xl font-black text-[#116B63] mt-1 font-heading">{stats?.active_bookings || 0}</div>
          <div className="text-[11px] text-[#116B63] font-semibold mt-1">{stats?.completed_bookings || 0} completed</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-2xs">
          <div className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Platform Gross Volume</div>
          <div className="text-2xl font-black text-[#172B2A] mt-1 font-heading">₹{stats?.total_volume || '0'}</div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">Direct to independent workers</div>
        </div>
      </div>

      {/* TAB SELECTOR */}
      <div className="flex border-b border-[#E2E8F0] mb-6 gap-2">
        <button
          onClick={() => setTab('verifications')}
          className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${tab === 'verifications' ? 'border-[#116B63] text-[#116B63]' : 'border-transparent text-[#64748B] hover:text-[#172B2A]'}`}
        >
          <ShieldCheck size={16} />
          <span>Worker Verification Queue ({verifications.length})</span>
        </button>

        <button
          onClick={() => setTab('requests')}
          className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${tab === 'requests' ? 'border-[#116B63] text-[#116B63]' : 'border-transparent text-[#64748B] hover:text-[#172B2A]'}`}
        >
          <FileText size={16} />
          <span>All Job Requests ({jobRequests.length})</span>
        </button>

        <button
          onClick={() => setTab('bookings')}
          className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${tab === 'bookings' ? 'border-[#116B63] text-[#116B63]' : 'border-transparent text-[#64748B] hover:text-[#172B2A]'}`}
        >
          <Clock size={16} />
          <span>Confirmed Bookings & Cancellations ({bookings.length})</span>
        </button>
      </div>

      {loading ? (
        <LoadingSkeleton count={3} type="row" />
      ) : (
        <>
          {/* TAB 1: VERIFICATIONS QUEUE */}
          {tab === 'verifications' && (
            <div className="space-y-4">
              {verifications.length === 0 ? (
                <EmptyState
                  title="No verification records pending"
                  description="All workers on the platform have been processed."
                />
              ) : (
                verifications.map((rec) => (
                  <div
                    key={rec.id}
                    className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-2xs hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2.5">
                        <StatusBadge status={rec.status === 'APPROVED' ? 'COMPLETED' : rec.status === 'REJECTED' ? 'CANCELLED' : 'OPEN'} />
                        <span className="text-xs font-bold text-[#116B63]">{rec.id_type}</span>
                        <span className="text-xs text-[#64748B]">Masked: {rec.id_number_masked}</span>
                      </div>

                      <h3 className="font-bold text-base text-[#172B2A]">
                        {rec.worker_name} &bull; <span className="text-sm font-normal text-[#64748B]">{rec.worker_title}</span>
                      </h3>

                      <p className="text-xs text-[#64748B]">
                        Locality: {rec.worker_locality} &bull; Submitted: {new Date(rec.submitted_at).toLocaleDateString()}
                      </p>

                      <button
                        type="button"
                        onClick={() => setExpandedVerificationId(
                          expandedVerificationId === rec.id ? null : rec.id
                        )}
                        aria-expanded={expandedVerificationId === rec.id}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#116B63] hover:underline"
                      >
                        {expandedVerificationId === rec.id ? 'Hide applicant details' : 'View applicant details'}
                        {expandedVerificationId === rec.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>

                      {expandedVerificationId === rec.id && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl border border-[#E2E8F0] bg-slate-50 p-4 text-xs text-[#475569]">
                          <p><span className="font-bold text-[#172B2A]">Email:</span> {rec.worker_email || 'Not provided'}</p>
                          <p><span className="font-bold text-[#172B2A]">Phone:</span> {rec.worker_phone || 'Not provided'}</p>
                          <p><span className="font-bold text-[#172B2A]">Experience:</span> {rec.worker_experience_years} years</p>
                          <p><span className="font-bold text-[#172B2A]">Hourly rate:</span> ₹{rec.worker_hourly_rate}</p>
                          <p className="sm:col-span-2">
                            <span className="font-bold text-[#172B2A]">Trade skills:</span>{' '}
                            {rec.worker_skills?.length
                              ? rec.worker_skills.map((skill) => `${skill.category_name} — ${skill.skill_name} (${skill.experience_years} years)`).join(', ')
                              : 'No skills listed'}
                          </p>
                          <p className="sm:col-span-2">
                            <span className="font-bold text-[#172B2A]">About:</span> {rec.worker_bio || 'No profile description provided'}
                          </p>
                          {rec.document_notes && (
                            <p className="sm:col-span-2">
                              <span className="font-bold text-[#172B2A]">Verification notes:</span> {rec.document_notes}
                            </p>
                          )}
                        </div>
                      )}

                      {rec.admin_remarks && (
                        <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic">
                          Admin Remarks: "{rec.admin_remarks}"
                        </p>
                      )}

                      {/* Optional inline remarks input */}
                      {rec.status === 'PENDING' && (
                        <div className="pt-2">
                          <input
                            type="text"
                            placeholder="Add remarks for this decision (optional)..."
                            value={adminRemarks[rec.worker] || ''}
                            onChange={(e) => setAdminRemarks({ ...adminRemarks, [rec.worker]: e.target.value })}
                            className="w-full max-w-md p-2 bg-slate-50 border border-[#E2E8F0] rounded-lg text-xs"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-[#E2E8F0]">
                      {rec.status === 'PENDING' ? (
                        <>
                          <Button
                            variant="success"
                            size="sm"
                            icon={CheckCircle2}
                            loading={actionLoading}
                            onClick={() => handleVerify(rec.worker, 'APPROVE')}
                          >
                            Approve Verification
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            icon={XCircle}
                            loading={actionLoading}
                            onClick={() => handleVerify(rec.worker, 'REJECT')}
                          >
                            Reject
                          </Button>
                        </>
                      ) : (
                        <span className="text-xs font-bold text-[#64748B] bg-slate-100 px-3 py-1.5 rounded-xl">
                          Decision Recorded
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: ALL JOB REQUESTS */}
          {tab === 'requests' && (
            <div className="space-y-4">
              {jobRequests.map((req) => (
                <div key={req.id} className="bg-white p-5 rounded-2xl border border-[#E2E8F0] flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={req.status} />
                      <span className="text-xs font-bold text-[#116B63]">{req.category?.name}</span>
                    </div>
                    <h4 className="text-sm font-bold text-[#172B2A] mt-1">{req.title}</h4>
                    <p className="text-xs text-[#64748B]">Customer: {req.customer?.full_name} &bull; {req.locality}</p>
                  </div>
                  <div className="text-right text-xs">
                    <div className="font-bold text-[#172B2A]">Budget: ₹{req.budget_min} - ₹{req.budget_max}</div>
                    <div className="text-[#64748B]">{req.quotes_count} quotes submitted</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: ALL BOOKINGS & CANCELLATIONS */}
          {tab === 'bookings' && (
            <div className="space-y-4">
              {bookings.map((b) => (
                <div key={b.id} className="bg-white p-5 rounded-2xl border border-[#E2E8F0] flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={b.status} />
                      <span className="text-xs font-bold text-[#116B63]">Booking #{b.id}</span>
                    </div>
                    <h4 className="text-sm font-bold text-[#172B2A] mt-1">{b.job_request?.title}</h4>
                    <p className="text-xs text-[#64748B]">
                      Customer: {b.customer?.full_name} &bull; Worker: {b.worker?.user?.full_name}
                    </p>
                    {b.status === 'CANCELLED' && b.cancellation_reason && (
                      <p className="text-xs text-rose-700 mt-1 italic">
                        Cancellation: "{b.cancellation_reason}" by {b.cancelled_by_name || 'Participant'}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-[#64748B]">Amount</div>
                    <div className="text-base font-black text-[#116B63]">₹{b.final_amount}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

    </div>
  );
}
