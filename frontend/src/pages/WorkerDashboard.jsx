import React, { useState, useEffect } from 'react';
import {
  Briefcase, IndianRupee, Clock, CheckCircle2, AlertCircle,
  PlayCircle, Send, ToggleLeft, ToggleRight, MapPin, Calendar,
  ShieldCheck, FileText, ArrowRight, UserCheck, Star, Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import Button from '../components/common/Button';
import PageHeader from '../components/common/PageHeader';
import StatusBadge from '../components/common/StatusBadge';
import VerificationBadge from '../components/common/VerificationBadge';
import Modal from '../components/common/Modal';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';

export default function WorkerDashboard({ onNavigate, onSelectBooking }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [myQuotes, setMyQuotes] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quote Submission Modal
  const [quoteModalJob, setQuoteModalJob] = useState(null);
  const [labourCost, setLabourCost] = useState('450');
  const [materialsCost, setMaterialsCost] = useState('0');
  const [additionalCost, setAdditionalCost] = useState('0');
  const [quoteNotes, setQuoteNotes] = useState('');
  const [submittingQuote, setSubmittingQuote] = useState(false);

  // Active Tab
  const [tab, setTab] = useState('requests'); // 'requests', 'quotes', 'jobs'

  const loadData = async () => {
    setLoading(true);
    try {
      const [wp, reqs, qts, bks] = await Promise.all([
        api.workers.myProfile(),
        api.jobRequests.list(),
        api.quotes.list(),
        api.bookings.list()
      ]);
      setProfile(wp);
      setIncomingRequests(reqs.results || reqs || []);
      setMyQuotes(qts.results || qts || []);
      setBookings(bks.results || bks || []);
    } catch (err) {
      console.error('Error loading worker dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleAvailability = async () => {
    try {
      const res = await api.workers.toggleAvailability();
      setProfile(prev => ({ ...prev, is_available: res.is_available }));
    } catch (err) {
      alert(err.message || 'Failed to toggle availability.');
    }
  };

  const handleOpenQuoteModal = (job) => {
    setQuoteModalJob(job);
    setLabourCost(String(parseInt(profile?.hourly_rate || 400) * 2));
    setMaterialsCost('0');
    setAdditionalCost('0');
    setQuoteNotes('');
  };

  const handleSubmitQuote = async (e) => {
    e.preventDefault();
    setSubmittingQuote(true);
    try {
      await api.quotes.create({
        job_request: quoteModalJob.id,
        labour_cost: labourCost,
        materials_cost: materialsCost,
        additional_cost: additionalCost,
        notes: quoteNotes,
        estimated_hours: 2.0
      });
      setQuoteModalJob(null);
      await loadData();
      setTab('quotes');
    } catch (err) {
      alert(err.message || 'Failed to submit quote.');
    } finally {
      setSubmittingQuote(false);
    }
  };

  const handleStartBooking = async (bId) => {
    try {
      await api.bookings.start(bId);
      await loadData();
    } catch (e) {
      alert(e.message || 'Failed to start job.');
    }
  };

  const handleCompleteBooking = async (bId) => {
    try {
      await api.bookings.complete(bId);
      await loadData();
    } catch (e) {
      alert(e.message || 'Failed to complete job.');
    }
  };

  const totalCalculatedQuote = (parseFloat(labourCost) || 0) + (parseFloat(materialsCost) || 0) + (parseFloat(additionalCost) || 0);

  // Compute real completed jobs earnings from database
  const completedBookings = bookings.filter(b => b.status === 'COMPLETED');
  const realEarnings = completedBookings.reduce((sum, b) => sum + parseFloat(b.final_amount || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Worker Header with Availability Toggle */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E8F0] shadow-sm mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0B4945] to-[#116B63] text-white flex items-center justify-center font-bold text-2xl shadow-md shrink-0">
            {user?.full_name?.charAt(0) || 'W'}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-black text-[#172B2A] font-heading">
                {user?.full_name}
              </h1>
              {profile && <VerificationBadge status={profile.verification_status} />}
            </div>
            <p className="text-sm text-[#64748B] mt-0.5">{profile?.title} &bull; {profile?.locality}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-[#64748B]">
              <span className="font-semibold text-[#116B63]">Rate: ₹{profile?.hourly_rate}/hr</span>
              <span>&bull;</span>
              <span>Service Radius: {profile?.service_radius_km} km</span>
              <span>&bull;</span>
              <span className="flex items-center gap-1 text-amber-600 font-bold">
                <Star size={13} className="fill-amber-500 text-amber-500" />
                {profile?.average_rating} Rating
              </span>
            </div>
          </div>
        </div>

        {/* Availability Control Button */}
        <div className="flex items-center gap-3 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-[#E2E8F0]">
          <button
            type="button"
            onClick={handleToggleAvailability}
            className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs ${profile?.is_available ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-700 border border-slate-300'}`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${profile?.is_available ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            <span>{profile?.is_available ? 'Online & Accepting Jobs' : 'Offline / Busy'}</span>
          </button>
        </div>
      </div>

      {/* METRICS OVERVIEW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-2xs">
          <div className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Available Requests</div>
          <div className="text-2xl font-black text-[#172B2A] mt-1 font-heading">{incomingRequests.length}</div>
          <div className="text-[11px] text-[#116B63] font-semibold mt-1">Matching your trade</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-2xs">
          <div className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Submitted Quotes</div>
          <div className="text-2xl font-black text-[#172B2A] mt-1 font-heading">{myQuotes.length}</div>
          <div className="text-[11px] text-[#64748B] mt-1">Awaiting customer approval</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-2xs">
          <div className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Active Bookings</div>
          <div className="text-2xl font-black text-[#172B2A] mt-1 font-heading">
            {bookings.filter(b => b.status !== 'COMPLETED' && b.status !== 'CANCELLED').length}
          </div>
          <div className="text-[11px] text-blue-600 font-semibold mt-1">Confirmed / In progress</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-2xs">
          <div className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Total Real Earnings</div>
          <div className="text-2xl font-black text-[#116B63] mt-1 font-heading">₹{realEarnings.toFixed(0)}</div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">{completedBookings.length} completed jobs</div>
        </div>
      </div>

      {/* TABS SELECTOR */}
      <div className="flex border-b border-[#E2E8F0] mb-6 gap-2">
        <button
          onClick={() => setTab('requests')}
          className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${tab === 'requests' ? 'border-[#116B63] text-[#116B63]' : 'border-transparent text-[#64748B] hover:text-[#172B2A]'}`}
        >
          <Briefcase size={16} />
          <span>Incoming Requests ({incomingRequests.length})</span>
        </button>

        <button
          onClick={() => setTab('quotes')}
          className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${tab === 'quotes' ? 'border-[#116B63] text-[#116B63]' : 'border-transparent text-[#64748B] hover:text-[#172B2A]'}`}
        >
          <Send size={16} />
          <span>My Quotes ({myQuotes.length})</span>
        </button>

        <button
          onClick={() => setTab('jobs')}
          className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${tab === 'jobs' ? 'border-[#116B63] text-[#116B63]' : 'border-transparent text-[#64748B] hover:text-[#172B2A]'}`}
        >
          <CheckCircle2 size={16} />
          <span>Active & Completed Jobs ({bookings.length})</span>
        </button>
      </div>

      {/* TAB CONTENT: INCOMING REQUESTS */}
      {tab === 'requests' && (
        <div className="space-y-4">
          {incomingRequests.length === 0 ? (
            <EmptyState
              title="No open requests in your area"
              description="New household requests matching your skill category and service radius will appear here as they are posted."
            />
          ) : (
            incomingRequests.map((req) => {
              const alreadyQuoted = myQuotes.some(q => q.job_request === req.id);
              return (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-2xs hover:shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#116B63] bg-[#EAF5F1] px-2.5 py-0.5 rounded-full">
                        {req.category?.name}
                      </span>
                      <span className="text-xs text-[#64748B]">
                        Posted by {req.customer?.full_name?.split(' ')[0]} in {req.locality}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-[#172B2A]">
                      {req.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed line-clamp-2 max-w-2xl">
                      {req.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748B] pt-1">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-[#116B63] shrink-0" />
                        Requested: {req.preferred_date} ({req.preferred_time_slot})
                      </span>
                      <span className="font-semibold text-[#172B2A]">
                        Budget Range: ₹{parseInt(req.budget_min)} - ₹{parseInt(req.budget_max)}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-[#E2E8F0]">
                    {alreadyQuoted ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 text-teal-800 text-xs font-bold border border-teal-200">
                        <CheckCircle2 size={14} />
                        <span>Quote Submitted</span>
                      </span>
                    ) : (
                      <Button
                        variant="primary"
                        size="md"
                        icon={Send}
                        onClick={() => handleOpenQuoteModal(req)}
                      >
                        Submit Itemized Quote
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB CONTENT: MY QUOTES */}
      {tab === 'quotes' && (
        <div className="space-y-4">
          {myQuotes.length === 0 ? (
            <EmptyState
              title="No quotes submitted yet"
              description="Browse incoming requests and submit competitive, itemized quotes to win household bookings."
            />
          ) : (
            myQuotes.map((quote) => (
              <div
                key={quote.id}
                className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={quote.status} />
                    <span className="text-xs text-[#64748B]">Quote #{quote.id}</span>
                  </div>

                  <h3 className="font-bold text-base text-[#172B2A]">
                    {quote.job_title}
                  </h3>

                  <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl max-w-md text-xs border border-slate-100">
                    <div>Labour: <strong className="text-[#172B2A]">₹{quote.labour_cost}</strong></div>
                    <div>Parts/Materials: <strong className="text-[#172B2A]">₹{quote.materials_cost || 0}</strong></div>
                    <div>Additional: <strong className="text-[#172B2A]">₹{quote.additional_cost || 0}</strong></div>
                  </div>

                  {quote.notes && (
                    <p className="text-xs text-[#64748B] italic">"{quote.notes}"</p>
                  )}
                </div>

                <div className="text-right shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-[#E2E8F0]">
                  <div className="text-xs text-[#64748B] font-medium">Total Quoted</div>
                  <div className="text-xl font-black text-[#116B63]">₹{quote.total_amount}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB CONTENT: ACTIVE & COMPLETED JOBS */}
      {tab === 'jobs' && (
        <div className="space-y-4">
          {bookings.length === 0 ? (
            <EmptyState
              title="No bookings assigned yet"
              description="When a customer approves your quote, confirmed jobs will be listed here with direct action controls."
            />
          ) : (
            bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={booking.status} />
                    <span className="text-xs font-bold text-[#116B63]">Booking #{booking.id}</span>
                  </div>

                  <h3 className="font-bold text-base text-[#172B2A]">
                    {booking.job_request?.title}
                  </h3>

                  <div className="space-y-1 text-xs text-[#64748B]">
                    <div>Customer: <strong className="text-[#172B2A]">{booking.customer?.full_name}</strong> ({booking.customer?.phone || 'Phone number not provided'})</div>
                    <div>Locality: {booking.job_request?.locality}</div>
                    <div>Schedule: {booking.scheduled_date} &bull; {booking.scheduled_slot}</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 shrink-0">
                  <div className="text-right sm:pr-4 sm:border-r border-[#E2E8F0]">
                    <div className="text-xs text-[#64748B]">Payment Due</div>
                    <div className="text-lg font-black text-[#116B63]">₹{booking.final_amount}</div>
                  </div>

                  {booking.status === 'CONFIRMED' && (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={PlayCircle}
                      onClick={() => handleStartBooking(booking.id)}
                    >
                      Start Work
                    </Button>
                  )}

                  {booking.status === 'IN_PROGRESS' && (
                    <Button
                      variant="success"
                      size="sm"
                      icon={CheckCircle2}
                      onClick={() => handleCompleteBooking(booking.id)}
                    >
                      Mark Finished
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onSelectBooking(booking.id);
                      onNavigate('booking-details');
                    }}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* QUOTE SUBMISSION MODAL */}
      <Modal
        isOpen={!!quoteModalJob}
        onClose={() => setQuoteModalJob(null)}
        title={`Submit Itemized Quote for Job #${quoteModalJob?.id}`}
        subtitle={quoteModalJob?.title}
        maxWidth="max-w-lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <div>
              <span className="text-xs text-[#64748B]">Total Amount: </span>
              <strong className="text-lg font-black text-[#116B63]">₹{totalCalculatedQuote}</strong>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setQuoteModalJob(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Send}
                loading={submittingQuote}
                onClick={handleSubmitQuote}
              >
                Send Quote
              </Button>
            </div>
          </div>
        }
      >
        {quoteModalJob && (
          <form onSubmit={handleSubmitQuote} className="space-y-4 text-xs sm:text-sm">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-[#64748B] space-y-1">
              <div>Customer Budget: <strong>₹{quoteModalJob.budget_min} - ₹{quoteModalJob.budget_max}</strong></div>
              <div>Schedule: <strong>{quoteModalJob.preferred_date} ({quoteModalJob.preferred_time_slot})</strong></div>
            </div>

            {/* 1-Click Quick Quote Presets for Fast MVP Evaluation */}
            <div>
              <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1.5">
                Quick Quote Presets:
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLabourCost('450');
                    setMaterialsCost('0');
                    setAdditionalCost('50');
                    setQuoteNotes('Initial diagnosis, safety inspection and wiring check.');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white border border-[#E2E8F0] hover:border-[#116B63] text-xs font-semibold text-[#172B2A] hover:bg-slate-50 transition-colors"
                >
                  Standard Fix (₹500)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLabourCost('600');
                    setMaterialsCost('250');
                    setAdditionalCost('50');
                    setQuoteNotes('Includes replacement parts and load calibration.');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white border border-[#E2E8F0] hover:border-[#116B63] text-xs font-semibold text-[#172B2A] hover:bg-slate-50 transition-colors"
                >
                  With Spares (₹900)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLabourCost('800');
                    setMaterialsCost('350');
                    setAdditionalCost('100');
                    setQuoteNotes('Full overhaul with 30-day service warranty.');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white border border-[#E2E8F0] hover:border-[#116B63] text-xs font-semibold text-[#172B2A] hover:bg-slate-50 transition-colors"
                >
                  Full Overhaul (₹1,250)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#172B2A] uppercase tracking-wider mb-1">
                  Labour (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="50"
                  value={labourCost}
                  onChange={(e) => setLabourCost(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#116B63]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172B2A] uppercase tracking-wider mb-1">
                  Parts/Materials (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={materialsCost}
                  onChange={(e) => setMaterialsCost(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#116B63]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172B2A] uppercase tracking-wider mb-1">
                  Additional / Travel (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={additionalCost}
                  onChange={(e) => setAdditionalCost(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#116B63]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172B2A] uppercase tracking-wider mb-1">
                Quote Explanation & Proposed Spares
              </label>
              <textarea
                rows={3}
                value={quoteNotes}
                onChange={(e) => setQuoteNotes(e.target.value)}
                placeholder="Explain the work required, diagnostic approach, and estimated timeline..."
                className="w-full p-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#116B63]"
              />
            </div>
          </form>
        )}
      </Modal>

    </div>
  );
}
