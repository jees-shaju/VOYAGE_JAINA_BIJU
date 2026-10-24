import React, { useState, useEffect } from 'react';
import {
  PlusCircle, Calendar, Clock, MapPin, IndianRupee,
  FileText, CheckCircle2, AlertCircle, ArrowRight, User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import Button from '../components/common/Button';
import StatusBadge from '../components/common/StatusBadge';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';
import LoadingSkeleton from '../components/common/LoadingSkeleton';

export default function CustomerDashboard({ onNavigate, onSelectJobRequest, onSelectBooking }) {
  const { user } = useAuth();
  const [jobRequests, setJobRequests] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [reqs, bks] = await Promise.all([
          api.jobRequests.list(),
          api.bookings.list()
        ]);
        setJobRequests(reqs.results || reqs || []);
        setBookings(bks.results || bks || []);
      } catch (err) {
        console.error('Error loading customer dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header with CTA */}
      <PageHeader
        title={`Welcome back, ${user?.full_name?.split(' ')[0] || user?.username}`}
        subtitle={`Discover skilled local workers in ${user?.locality || 'your area'} with transparent quotes.`}
        actions={
          <Button
            variant="primary"
            size="md"
            icon={PlusCircle}
            onClick={() => onNavigate('create-request')}
            className="shadow-sm font-semibold"
          >
            Post Service Request
          </Button>
        }
      />

      {loading ? (
        <LoadingSkeleton count={3} type="card" />
      ) : (
        <div className="space-y-12">
          
          {/* ACTIVE BOOKINGS SECTION */}
          <section>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-[#172B2A] font-heading">
                  Active & Confirmed Bookings
                </h2>
                <p className="text-xs text-[#64748B]">Scheduled services and booking progress</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-full text-[#172B2A]">
                {bookings.filter(b => b.status !== 'COMPLETED' && b.status !== 'CANCELLED').length} Active
              </span>
            </div>

            {bookings.length === 0 ? (
              <EmptyState
                title="No active bookings yet"
                description="When you approve a worker's quote, your confirmed booking and schedule progress will appear here."
                actionLabel="Create Service Request"
                onAction={() => onNavigate('create-request')}
                actionIcon={PlusCircle}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="bg-white rounded-2xl border border-[#E2E8F0] hover:border-[#116B63]/40 shadow-xs hover:shadow-md transition-all p-6 flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <StatusBadge status={booking.status} />
                        <span className="text-xs font-bold text-[#116B63]">
                          Booking #{booking.id}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-bold text-base text-[#172B2A] line-clamp-1">
                          {booking.job_request?.title || 'Household Service'}
                        </h3>
                        <p className="text-xs text-[#64748B] mt-0.5">
                          {booking.job_request?.category?.name}
                        </p>
                      </div>

                      {/* Worker info */}
                      <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-3 border border-slate-100">
                        <div className="w-10 h-10 rounded-full bg-[#EAF5F1] text-[#0B4945] font-bold text-xs flex items-center justify-center shrink-0">
                          {booking.worker?.user?.full_name?.charAt(0) || 'W'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-[#172B2A] truncate">
                            {booking.worker?.user?.full_name}
                          </div>
                          <div className="text-[11px] text-[#64748B] truncate">
                            {booking.worker?.title}
                          </div>
                        </div>
                      </div>

                      {/* Schedule info */}
                      <div className="space-y-2 text-xs text-[#64748B]">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-[#116B63] shrink-0" />
                          <span>{booking.scheduled_date} &bull; {booking.scheduled_slot}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <IndianRupee size={14} className="text-[#116B63] shrink-0" />
                          <span className="font-bold text-[#172B2A]">Final Agreed: ₹{booking.final_amount}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-5 mt-5 border-t border-[#E2E8F0]">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          onSelectBooking(booking.id);
                          onNavigate('booking-details');
                        }}
                        className="w-full justify-between"
                      >
                        <span>View Progress & Quote</span>
                        <ArrowRight size={14} className="shrink-0" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* SERVICE REQUESTS SECTION */}
          <section>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-[#172B2A] font-heading">
                  My Posted Service Requests
                </h2>
                <p className="text-xs text-[#64748B]">Requests awaiting matching, quotes, or approval</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-full text-[#172B2A]">
                {jobRequests.length} Total Requests
              </span>
            </div>

            {jobRequests.length === 0 ? (
              <EmptyState
                title="No service requests posted"
                description="Need a repair or installation? Describe your requirements in 1 minute and get matched with qualified workers."
                actionLabel="Create First Request"
                onAction={() => onNavigate('create-request')}
                actionIcon={PlusCircle}
              />
            ) : (
              <div className="space-y-4">
                {jobRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 hover:border-[#116B63]/40 shadow-2xs hover:shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <StatusBadge status={req.status} />
                        <span className="text-xs font-bold text-[#116B63]">
                          {req.category?.name}
                        </span>
                        <span className="text-xs text-[#64748B]">
                          &bull; Posted on {new Date(req.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-[#172B2A]">
                        {req.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-[#64748B] line-clamp-2 max-w-2xl leading-relaxed">
                        {req.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748B] pt-1">
                        <span className="flex items-center gap-1.5">
                          <MapPin size={14} className="text-[#116B63] shrink-0" />
                          {req.locality}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-[#116B63] shrink-0" />
                          Preferred: {req.preferred_date} ({req.preferred_time_slot})
                        </span>
                        <span className="flex items-center gap-1.5 font-medium text-[#172B2A]">
                          Budget: ₹{parseInt(req.budget_min)} - ₹{parseInt(req.budget_max)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-[#E2E8F0]">
                      <Button
                        variant="primary"
                        size="md"
                        icon={ArrowRight}
                        iconPosition="right"
                        onClick={() => {
                          onSelectJobRequest(req.id);
                          onNavigate('matched-workers');
                        }}
                      >
                        View Matches ({req.quotes_count} Quotes)
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      )}

    </div>
  );
}
