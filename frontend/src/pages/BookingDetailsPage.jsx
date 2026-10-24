import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, MapPin, IndianRupee, Phone, CheckCircle2,
  AlertCircle, Star, Ban, PlayCircle, ShieldCheck, ArrowLeft
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import PageHeader from '../components/common/PageHeader';
import StatusBadge from '../components/common/StatusBadge';
import VerificationBadge from '../components/common/VerificationBadge';
import Modal from '../components/common/Modal';
import LoadingSkeleton from '../components/common/LoadingSkeleton';

export default function BookingDetailsPage({ bookingId, onNavigate }) {
  const { user, isCustomer, isWorker, isAdmin } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Cancellation Modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Review Modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const loadBooking = async () => {
    if (!bookingId) {
      onNavigate(isWorker ? 'worker-dashboard' : 'customer-dashboard');
      return;
    }
    setLoading(true);
    try {
      const data = await api.bookings.get(bookingId);
      setBooking(data);
    } catch (err) {
      console.error('Error loading booking:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  const handleStartJob = async () => {
    setActionLoading(true);
    try {
      await api.bookings.start(booking.id);
      await loadBooking();
    } catch (err) {
      alert(err.message || 'Failed to start job.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteJob = async () => {
    setActionLoading(true);
    try {
      await api.bookings.complete(booking.id);
      await loadBooking();
      if (isCustomer) {
        setReviewModalOpen(true);
      }
    } catch (err) {
      alert(err.message || 'Failed to complete job.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!cancelReason.trim()) {
      alert('Please specify a cancellation reason.');
      return;
    }
    setActionLoading(true);
    try {
      await api.bookings.cancel(booking.id, cancelReason);
      setCancelModalOpen(false);
      await loadBooking();
    } catch (err) {
      alert(err.message || 'Failed to cancel booking.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.reviews.create({
        booking: booking.id,
        rating,
        comment
      });
      setReviewModalOpen(false);
      await loadBooking();
    } catch (err) {
      alert(err.message || 'Failed to submit review.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <LoadingSkeleton count={2} type="card" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-sm text-[#64748B]">Booking not found.</p>
        <Button variant="primary" size="md" onClick={() => onNavigate('customer-dashboard')} className="mt-4">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const steps = [
    { title: 'Requested', done: true },
    { title: 'Quote Approved', done: true },
    { title: 'In Progress', done: booking.status === 'IN_PROGRESS' || booking.status === 'COMPLETED' },
    { title: 'Completed', done: booking.status === 'COMPLETED' },
  ];

  const isAssignedWorker = isWorker && booking.worker?.user?.id === user?.id;
  const isBookingCustomer = isCustomer && booking.customer?.id === user?.id;
  const canManageBooking = isAssignedWorker || isBookingCustomer || isAdmin;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      <PageHeader
        title={`Booking #${booking.id}`}
        subtitle={`${booking.job_request?.category?.name || 'Service'} &bull; ${booking.job_request?.title}`}
        badge={<StatusBadge status={booking.status} />}
        onBack={() => onNavigate(isWorker ? 'worker-dashboard' : 'customer-dashboard')}
        actions={
          canManageBooking && booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED' && (
            <Button
              variant="outline"
              size="sm"
              icon={Ban}
              onClick={() => setCancelModalOpen(true)}
              className="text-[#C24141] hover:bg-rose-50 border-rose-200"
            >
              Cancel Booking
            </Button>
          )
        }
      />

      {/* LIFECYCLE PROGRESS STEPPER */}
      {booking.status !== 'CANCELLED' ? (
        <div className="bg-white p-6 rounded-3xl border border-[#E2E8F0] shadow-xs mb-8">
          <div className="grid grid-cols-4 gap-2 text-center">
            {steps.map((st, i) => (
              <div key={i} className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs mb-2 transition-all ${st.done ? 'bg-[#116B63] text-white shadow-xs' : 'bg-slate-100 text-[#64748B]'}`}
                >
                  {st.done ? <CheckCircle2 size={16} /> : i + 1}
                </div>
                <span className={`text-xs font-semibold ${st.done ? 'text-[#116B63]' : 'text-[#64748B]'}`}>
                  {st.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-8 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-xs text-rose-800">
          <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">This booking was cancelled.</div>
            <div>Reason: {booking.cancellation_reason || 'Cancelled by participant.'}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Column: Task & Quote Breakdown */}
        <div className="md:col-span-7 space-y-6">
          
          {/* Task Info Card */}
          <div className="bg-white p-6 rounded-3xl border border-[#E2E8F0] shadow-xs space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#64748B]">
              Job Information
            </h3>
            <div>
              <h2 className="text-lg font-bold text-[#172B2A]">
                {booking.job_request?.title}
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B] mt-1.5 leading-relaxed">
                {booking.job_request?.description}
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#E2E8F0] text-xs text-[#64748B]">
              <div className="flex items-center gap-2">
                <MapPin size={15} className="text-[#116B63] shrink-0" />
                <span>{booking.job_request?.locality}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={15} className="text-[#116B63] shrink-0" />
                <span>Scheduled for: {booking.scheduled_date} &bull; {booking.scheduled_slot}</span>
              </div>
            </div>
          </div>

          {/* Locked Quote Breakdown */}
          <div className="bg-white p-6 rounded-3xl border border-[#E2E8F0] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#64748B]">
                Transparent Quote Breakdown
              </h3>
              <span className="text-[11px] font-semibold text-[#16845B] bg-[#EAF5F1] px-2 py-0.5 rounded">
                Locked & Agreed
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-[#64748B]">
                <span>Labour & Craftsmanship:</span>
                <span className="font-semibold text-[#172B2A]">₹{booking.quote?.labour_cost}</span>
              </div>
              <div className="flex items-center justify-between text-[#64748B]">
                <span>Replacement Materials / Spares:</span>
                <span className="font-semibold text-[#172B2A]">₹{booking.quote?.materials_cost || '0.00'}</span>
              </div>
              <div className="flex items-center justify-between text-[#64748B]">
                <span>Additional Transport / Handling:</span>
                <span className="font-semibold text-[#172B2A]">₹{booking.quote?.additional_cost || '0.00'}</span>
              </div>
              <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-sm font-bold text-[#172B2A]">
                <span>Total Payable on Completion:</span>
                <span className="text-base text-[#116B63] font-black">₹{booking.final_amount}</span>
              </div>
            </div>

            {booking.quote?.notes && (
              <p className="text-xs text-[#64748B] italic pt-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                Worker Notes: "{booking.quote.notes}"
              </p>
            )}
          </div>

          {/* Review Card if reviewed */}
          {booking.review && (
            <div className="bg-[#EAF5F1]/50 p-6 rounded-3xl border border-[#16845B]/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0B4945] uppercase tracking-wider">
                  Verified Service Review
                </span>
                <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                  <Star size={15} className="fill-amber-500" />
                  <span>{booking.review.rating}.0 / 5</span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-[#172B2A] leading-relaxed italic">
                "{booking.review.comment}"
              </p>
              <div className="text-[11px] text-[#64748B]">
                Left by {booking.review.reviewer_name} &bull; {new Date(booking.review.created_at).toLocaleDateString()}
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Participant Card & Execution Controls */}
        <div className="md:col-span-5 space-y-6">
          
          {/* Worker / Customer Card */}
          <div className="bg-white p-6 rounded-3xl border border-[#E2E8F0] shadow-xs space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#64748B]">
              {isCustomer ? 'Assigned Worker' : 'Customer Contact'}
            </h3>

            {isCustomer ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#116B63] text-white flex items-center justify-center font-bold text-base shrink-0">
                    {booking.worker?.user?.full_name?.charAt(0) || 'W'}
                  </div>
                  <div>
                    <h4 className="font-bold text-[#172B2A]">
                      {booking.worker?.user?.full_name}
                    </h4>
                    <p className="text-xs text-[#64748B]">{booking.worker?.title}</p>
                    <VerificationBadge status={booking.worker?.verification_status} className="mt-1.5" />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-[#172B2A] border border-slate-100">
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-[#116B63] shrink-0" />
                    <span className="font-bold">{booking.worker?.user?.phone || 'Phone number not provided'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#64748B]">
                    <MapPin size={14} className="text-[#116B63] shrink-0" />
                    <span>Based in {booking.worker?.locality}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-slate-200 text-[#172B2A] flex items-center justify-center font-bold text-base shrink-0">
                    {booking.customer?.full_name?.charAt(0) || 'C'}
                  </div>
                  <div>
                    <h4 className="font-bold text-[#172B2A]">
                      {booking.customer?.full_name}
                    </h4>
                    <p className="text-xs text-[#64748B]">Registered Customer</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-[#172B2A] border border-slate-100">
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-[#116B63] shrink-0" />
                    <span className="font-bold">{booking.customer?.phone || 'Phone number not provided'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#64748B]">
                    <MapPin size={14} className="text-[#116B63] shrink-0" />
                    <span>{booking.customer?.locality}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Lifecycle Action Buttons */}
          <div className="bg-white p-6 rounded-3xl border border-[#E2E8F0] shadow-xs space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#64748B]">
              Job Actions
            </h3>

            {booking.status === 'CONFIRMED' && (isAssignedWorker || isAdmin) && (
              <Button
                variant="primary"
                size="lg"
                icon={PlayCircle}
                loading={actionLoading}
                onClick={handleStartJob}
                className="w-full font-bold shadow-sm"
              >
                Start Service Execution
              </Button>
            )}

            {booking.status === 'IN_PROGRESS' && canManageBooking && (
              <Button
                variant="success"
                size="lg"
                icon={CheckCircle2}
                loading={actionLoading}
                onClick={handleCompleteJob}
                className="w-full font-bold shadow-sm"
              >
                Mark Service as Completed
              </Button>
            )}

            {booking.status === 'COMPLETED' && !booking.review && (isBookingCustomer || isAssignedWorker) && (
              <Button
                variant="secondary"
                size="lg"
                icon={Star}
                onClick={() => setReviewModalOpen(true)}
                className="w-full font-bold bg-[#EAF5F1] text-[#0B4945]"
              >
                Leave 5-Star Rating & Review
              </Button>
            )}

            {booking.status === 'COMPLETED' && booking.review && canManageBooking && (
              <div className="p-3 rounded-xl bg-[#EAF5F1] text-[#0B4945] text-xs font-semibold text-center flex items-center justify-center gap-1.5">
                <CheckCircle2 size={16} />
                <span>Job Completed & Feedback Submitted</span>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* CANCELLATION MODAL */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel This Service Booking"
        subtitle="Please specify why you need to cancel to maintain fair platform records."
        maxWidth="max-w-md"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button variant="outline" size="sm" onClick={() => setCancelModalOpen(false)}>
              Keep Booking
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={actionLoading}
              onClick={handleCancelBooking}
            >
              Confirm Cancellation
            </Button>
          </div>
        }
      >
        <div>
          <label className="block text-xs font-bold text-[#172B2A] uppercase tracking-wider mb-1.5">
            Cancellation Reason *
          </label>
          <textarea
            required
            rows={3}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="e.g. Rescheduled travel, issue resolved independently, etc."
            className="w-full p-3 bg-slate-50 border border-[#E2E8F0] rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>
      </Modal>

      {/* REVIEW SUBMISSION MODAL */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title="Review Worker Experience"
        subtitle="Share honest feedback about punctuality, skill quality, and cleanliness."
        maxWidth="max-w-md"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button variant="outline" size="sm" onClick={() => setReviewModalOpen(false)}>
              Skip
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={actionLoading}
              onClick={handleSubmitReview}
            >
              Submit Review
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmitReview} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#172B2A] uppercase tracking-wider mb-1.5">
              Rating (1 to 5 Stars)
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 text-amber-500 focus:outline-none"
                  aria-label={`${star} Stars`}
                >
                  <Star
                    size={28}
                    className={star <= rating ? "fill-amber-500 text-amber-500" : "text-slate-300"}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#172B2A] uppercase tracking-wider mb-1.5">
              Written Feedback
            </label>
            <textarea
              required
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. Arrived on time, fixed the issue cleanly, highly recommended!"
              className="w-full p-3 bg-slate-50 border border-[#E2E8F0] rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#116B63]"
            />
          </div>
        </form>
      </Modal>

    </div>
  );
}
