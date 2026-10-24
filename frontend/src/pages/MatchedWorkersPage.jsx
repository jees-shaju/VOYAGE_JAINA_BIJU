import React, { useState, useEffect } from 'react';
import {
  MapPin, Star, Award, ShieldCheck, ChevronDown, ChevronUp,
  Filter, ArrowUpDown, Info, Clock, IndianRupee, CheckCircle2,
  FileText, Send, Sparkles, AlertCircle
} from 'lucide-react';
import { api } from '../api/client';
import Button from '../components/common/Button';
import PageHeader from '../components/common/PageHeader';
import VerificationBadge from '../components/common/VerificationBadge';
import EmptyState from '../components/common/EmptyState';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import Modal from '../components/common/Modal';

export default function MatchedWorkersPage({ jobRequestId, onNavigate, onSelectBooking }) {
  const [jobRequest, setJobRequest] = useState(null);
  const [matches, setMatches] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [emptySuggestion, setEmptySuggestion] = useState(null);

  // Filter & Sort
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [sortBy, setSortBy] = useState('score'); // 'score', 'rate_asc', 'exp_desc'
  const [expandedMatchId, setExpandedMatchId] = useState(null);

  // Worker Profile Modal
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [workerReviews, setWorkerReviews] = useState([]);

  // Quote approval action loading
  const [approvingQuoteId, setApprovingQuoteId] = useState(null);

  useEffect(() => {
    async function loadData() {
      if (!jobRequestId) {
        onNavigate('customer-dashboard');
        return;
      }
      setLoading(true);
      try {
        const [job, matchData, quoteList] = await Promise.all([
          api.jobRequests.get(jobRequestId),
          api.jobRequests.matchedWorkers(jobRequestId),
          api.quotes.list(jobRequestId)
        ]);
        setJobRequest(job);
        setMatches(matchData.matches || []);
        setEmptySuggestion(matchData.empty_state_suggestion);
        setQuotes(quoteList.results || quoteList || []);
      } catch (err) {
        console.error('Error fetching matched workers:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [jobRequestId]);

  const handleViewProfile = async (worker) => {
    setSelectedWorker(worker);
    try {
      const revs = await api.workers.reviews(worker.id);
      setWorkerReviews(revs || []);
    } catch (e) {
      setWorkerReviews([]);
    }
  };

  const handleApproveQuote = async (quoteId) => {
    setApprovingQuoteId(quoteId);
    try {
      const res = await api.quotes.approve(quoteId);
      if (res.booking_id) {
        onSelectBooking(res.booking_id);
        onNavigate('booking-details');
      }
    } catch (err) {
      alert(err.message || 'Failed to approve quote.');
    } finally {
      setApprovingQuoteId(null);
    }
  };

  // Filter & Sorting Logic
  let filtered = matches.filter(m => {
    if (onlyVerified && m.worker.verification_status !== 'VERIFIED') return false;
    return true;
  });

  if (sortBy === 'score') {
    filtered.sort((a, b) => b.total_score - a.total_score);
  } else if (sortBy === 'rate_asc') {
    filtered.sort((a, b) => parseFloat(a.worker.hourly_rate) - parseFloat(b.worker.hourly_rate));
  } else if (sortBy === 'exp_desc') {
    filtered.sort((a, b) => b.worker.experience_years - a.worker.experience_years);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      <PageHeader
        title="Matched Local Workers"
        subtitle={jobRequest ? `Top candidates scored for: "${jobRequest.title}" (${jobRequest.category?.name})` : "Candidate Results"}
        onBack={() => onNavigate('customer-dashboard')}
        actions={
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#64748B] hidden sm:inline">
              Budget: ₹{jobRequest?.budget_min} - ₹{jobRequest?.budget_max}
            </span>
          </div>
        }
      />

      {/* FILTER & SORT BAR */}
      <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-2xs mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#172B2A]">
            <input
              type="checkbox"
              checked={onlyVerified}
              onChange={(e) => setOnlyVerified(e.target.checked)}
              className="rounded text-[#116B63] focus:ring-[#116B63] w-4 h-4"
            />
            <ShieldCheck size={16} className="text-[#16845B]" />
            <span>Show Only Admin-Verified Pros</span>
          </label>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-[#64748B] font-medium flex items-center gap-1.5">
            <ArrowUpDown size={14} className="shrink-0" />
            Sort By:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#172B2A] focus:outline-none focus:ring-1 focus:ring-[#116B63]"
          >
            <option value="score">Highest Match Score</option>
            <option value="rate_asc">Lowest Hourly Rate</option>
            <option value="exp_desc">Most Experience (Years)</option>
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton count={3} type="card" />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No eligible workers found"
          description={emptySuggestion || "No workers match your exact service location, availability, or budget criteria at this time. Try broadening your budget range or choosing flexible time slots."}
          actionLabel="Adjust Service Request"
          onAction={() => onNavigate('create-request')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => {
            const { worker, total_score, factor_scores, reasons, distance_km } = item;
            const isExpanded = expandedMatchId === worker.id;
            const existingQuote = quotes.find(q => q.worker?.id === worker.id);

            return (
              <div
                key={worker.id}
                className="bg-white rounded-3xl border border-[#E2E8F0] hover:border-[#116B63]/40 shadow-xs hover:shadow-lg transition-all p-6 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  
                  {/* Top Badge Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <VerificationBadge status={worker.verification_status} />
                    </div>
                    {/* Explainable Match Badge */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF5F1] text-[#0B4945] font-black text-xs border border-[#16845B]/20">
                      <Sparkles size={13} className="text-[#16845B] shrink-0" />
                      <span>{Math.round(total_score)}% Match</span>
                    </div>
                  </div>

                  {/* Worker identity */}
                  <div className="flex items-start gap-4 pt-1">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#116B63] to-[#0B4945] text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                      {worker.user?.full_name?.split(' ').map(n => n[0]).join('') || 'W'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base text-[#172B2A] truncate">
                        {worker.user?.full_name}
                      </h3>
                      <p className="text-xs text-[#64748B] truncate mt-0.5">
                        {worker.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-[#64748B]">
                        <span className="flex items-center gap-1 text-amber-600 font-bold">
                          <Star size={13} className="fill-amber-500 text-amber-500 shrink-0" />
                          {worker.average_rating} ({worker.completed_jobs_count ?? 0} jobs)
                        </span>
                        <span>&bull;</span>
                        <span>{worker.experience_years} yrs exp</span>
                      </div>
                    </div>
                  </div>

                  {/* Locality & Distance */}
                  <div className="flex items-center gap-2 text-xs text-[#64748B] pt-1">
                    <MapPin size={14} className="text-[#116B63] shrink-0" />
                    <span className="truncate">{worker.locality}</span>
                    <span className="font-bold text-[#116B63] shrink-0">({distance_km} km)</span>
                  </div>

                  {/* Rate Card */}
                  <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs border border-slate-100">
                    <span className="text-[#64748B] font-medium">Indicative Rate</span>
                    <span className="text-base font-extrabold text-[#116B63]">
                      ₹{parseInt(worker.hourly_rate)} / hr
                    </span>
                  </div>

                  {/* Match Factors Accordion / Breakdown */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setExpandedMatchId(isExpanded ? null : worker.id)}
                      className="w-full flex items-center justify-between text-xs font-semibold text-[#116B63] hover:text-[#0B4945] py-1"
                    >
                      <span className="flex items-center gap-1.5">
                        <Info size={14} className="shrink-0" />
                        Why this match score?
                      </span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {isExpanded && (
                      <div className="mt-2.5 p-3.5 bg-[#EAF5F1]/50 rounded-xl border border-[#16845B]/20 space-y-2.5 text-xs animate-in fade-in duration-150">
                        <div className="grid grid-cols-2 gap-2 text-[11px] pb-2 border-b border-[#16845B]/15 font-medium">
                          <div>Skill Fit: <strong className="text-[#0B4945]">{factor_scores?.skill_fit}%</strong></div>
                          <div>Proximity: <strong className="text-[#0B4945]">{factor_scores?.distance_fit}%</strong></div>
                          <div>Availability: <strong className="text-[#0B4945]">{factor_scores?.availability_fit}%</strong></div>
                          <div>Budget Fit: <strong className="text-[#0B4945]">{factor_scores?.budget_fit}%</strong></div>
                        </div>

                        <div className="space-y-1.5 pt-1 text-[#172B2A]/90">
                          {reasons?.map((reason, idx) => (
                            <div key={idx} className="flex items-start gap-1.5 text-[11px] leading-tight">
                              <CheckCircle2 size={12} className="text-[#16845B] shrink-0 mt-0.5" />
                              <span>{reason}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Active Quote Alert if Worker already quoted */}
                  {existingQuote && (
                    <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-teal-900">
                        <span>Submitted Quote:</span>
                        <span className="text-sm font-black text-[#116B63]">₹{existingQuote.total_amount}</span>
                      </div>
                      <p className="text-[11px] text-teal-800 line-clamp-2">
                        {existingQuote.notes || "Labour + basic replacement materials."}
                      </p>
                      {existingQuote.status === 'SUBMITTED' && (
                        <Button
                          variant="success"
                          size="sm"
                          loading={approvingQuoteId === existingQuote.id}
                          onClick={() => handleApproveQuote(existingQuote.id)}
                          className="w-full font-bold shadow-xs"
                        >
                          Approve Quote & Confirm Booking
                        </Button>
                      )}
                    </div>
                  )}

                </div>

                {/* Card Actions */}
                <div className="pt-4 mt-4 border-t border-[#E2E8F0] flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewProfile(worker)}
                    className="flex-1"
                  >
                    View Profile
                  </Button>
                  {!existingQuote && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleViewProfile(worker)}
                      className="flex-1"
                    >
                      Request Quote
                    </Button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* WORKER PROFILE MODAL */}
      <Modal
        isOpen={!!selectedWorker}
        onClose={() => setSelectedWorker(null)}
        title={selectedWorker?.user?.full_name || "Worker Profile"}
        subtitle={selectedWorker?.title}
        maxWidth="max-w-2xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="text-xs">
              <span className="text-[#64748B]">Rate: </span>
              <strong className="text-base text-[#116B63]">₹{parseInt(selectedWorker?.hourly_rate || 350)}/hr</strong>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedWorker(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Send}
                onClick={() => {
                  alert(`Quote request notified to ${selectedWorker?.user?.full_name}. They will review and submit itemized figures!`);
                  setSelectedWorker(null);
                }}
              >
                Send Quote Request
              </Button>
            </div>
          </div>
        }
      >
        {selectedWorker && (
          <div className="space-y-6 text-sm">
            <div className="flex items-center gap-3">
              <VerificationBadge status={selectedWorker.verification_status} />
              <span className="text-xs text-[#64748B] flex items-center gap-1">
                <MapPin size={14} className="text-[#116B63]" />
                {selectedWorker.locality} &bull; {selectedWorker.service_radius_km} km radius
              </span>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1.5">
                About the Professional
              </h4>
              <p className="text-sm text-[#172B2A] leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                {selectedWorker.bio || "Dedicated local technician committed to dependable workmanship and transparent client communication."}
              </p>
            </div>

            {/* Skills */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2">
                Certified Skills & Specialties
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedWorker.skills?.map((s) => (
                  <span
                    key={s.id}
                    className="px-3 py-1 rounded-lg bg-[#EAF5F1] text-[#0B4945] font-semibold text-xs border border-[#16845B]/20"
                  >
                    {s.skill_name} ({s.experience_years} yrs)
                  </span>
                ))}
              </div>
            </div>

            {/* Past Customer Reviews */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2.5">
                Past Completed Job Reviews ({workerReviews.length})
              </h4>
              {workerReviews.length === 0 ? (
                <p className="text-xs text-[#64748B] italic">No public reviews submitted yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {workerReviews.map((rev) => (
                    <div key={rev.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#172B2A]">{rev.reviewer_name}</span>
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                          <Star size={12} className="fill-amber-500" />
                          <span>{rev.rating}.0</span>
                        </div>
                      </div>
                      <p className="text-xs text-[#64748B]">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </Modal>

    </div>
  );
}
