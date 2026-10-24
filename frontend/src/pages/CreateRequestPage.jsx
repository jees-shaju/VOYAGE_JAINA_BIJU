import React, { useState, useEffect } from 'react';
import {
  PlusCircle, Calendar, Clock, MapPin, IndianRupee,
  FileText, AlertCircle, CheckCircle2, ArrowLeft, Wrench
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import PageHeader from '../components/common/PageHeader';

export default function CreateRequestPage({ onNavigate, onSelectJobRequest, preselectedCategory = '' }) {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);

  // Form State
  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locality, setLocality] = useState(user?.locality || 'Koramangala 4th Block, Bangalore');
  const [preferredDate, setPreferredDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [preferredTimeSlot, setPreferredTimeSlot] = useState('MORNING');
  const [budgetMin, setBudgetMin] = useState('400');
  const [budgetMax, setBudgetMax] = useState('1200');
  const [referenceNote, setReferenceNote] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const cats = await api.categories.list();
        const list = cats.results || cats || [];
        setCategories(list);
        if (list.length > 0) {
          if (preselectedCategory) {
            const matched = list.find(c => c.slug === preselectedCategory);
            setCategoryId(matched ? matched.id : list[0].id);
          } else {
            setCategoryId(list[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    }
    fetchCategories();
  }, [preselectedCategory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (parseFloat(budgetMin) > parseFloat(budgetMax)) {
      setError('Minimum budget cannot exceed maximum budget.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        category_id: categoryId,
        title,
        description,
        locality,
        latitude: 12.9352, // Default Koramangala coords for distance calculation
        longitude: 77.6245,
        preferred_date: preferredDate,
        preferred_time_slot: preferredTimeSlot,
        budget_min: budgetMin,
        budget_max: budgetMax,
        reference_note: referenceNote
      };

      const newJob = await api.jobRequests.create(payload);
      onSelectJobRequest(newJob.id);
      onNavigate('matched-workers');
    } catch (err) {
      setError(err.message || 'Failed to submit service request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      <PageHeader
        title="Post a Household Service Request"
        subtitle="Provide task details to receive explainable worker matches and itemized quotes."
        onBack={() => onNavigate('customer-dashboard')}
      />

      <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-xl p-6 sm:p-10">
        
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-xs sm:text-sm text-rose-800 font-medium">
            <AlertCircle size={18} className="text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Category & Title */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-[#172B2A] uppercase tracking-wider mb-1.5">
                Service Category *
              </label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#116B63]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-8">
              <label className="block text-xs font-bold text-[#172B2A] uppercase tracking-wider mb-1.5">
                Task Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Master Bedroom Switchboard Sparking & Tripping"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#116B63]"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-[#172B2A] uppercase tracking-wider mb-1.5">
              Detailed Description of the Issue *
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what needs repair, symptoms, appliance brand, or specific parts needed..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#116B63] leading-relaxed"
            />
          </div>

          {/* Locality */}
          <div>
            <label className="block text-xs font-bold text-[#172B2A] uppercase tracking-wider mb-1.5">
              Service Locality / Neighborhood *
            </label>
            <div className="relative">
              <MapPin size={18} className="absolute left-3.5 top-3 text-[#116B63]" />
              <input
                type="text"
                required
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                placeholder="e.g. Koramangala 4th Block, near Sony World Signal"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#116B63]"
              />
            </div>
            <p className="text-[11px] text-[#64748B] mt-1">
              Your exact flat number remains private until you approve a quote.
            </p>
          </div>

          {/* Preferred Date & Time Slot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#E2E8F0]">
            <div>
              <label className="block text-xs font-bold text-[#172B2A] uppercase tracking-wider mb-1.5">
                Preferred Service Date *
              </label>
              <input
                type="date"
                required
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#116B63]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172B2A] uppercase tracking-wider mb-1.5">
                Preferred Time Slot *
              </label>
              <select
                value={preferredTimeSlot}
                onChange={(e) => setPreferredTimeSlot(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#116B63]"
              >
                <option value="MORNING">Morning (8:00 AM - 12:00 PM)</option>
                <option value="AFTERNOON">Afternoon (12:00 PM - 4:00 PM)</option>
                <option value="EVENING">Evening (4:00 PM - 8:00 PM)</option>
                <option value="ANYTIME">Flexible / Anytime</option>
              </select>
            </div>
          </div>

          {/* Budget Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#172B2A] uppercase tracking-wider mb-1.5">
                Minimum Budget (₹) *
              </label>
              <div className="relative">
                <IndianRupee size={16} className="absolute left-3.5 top-3 text-[#64748B]" />
                <input
                  type="number"
                  required
                  min="100"
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#116B63]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172B2A] uppercase tracking-wider mb-1.5">
                Maximum Budget (₹) *
              </label>
              <div className="relative">
                <IndianRupee size={16} className="absolute left-3.5 top-3 text-[#64748B]" />
                <input
                  type="number"
                  required
                  min="100"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#116B63]"
                />
              </div>
            </div>
          </div>

          {/* Reference Notes / Access details */}
          <div>
            <label className="block text-xs font-bold text-[#172B2A] uppercase tracking-wider mb-1.5">
              Access Instructions & Special Tools (Optional)
            </label>
            <input
              type="text"
              value={referenceNote}
              onChange={(e) => setReferenceNote(e.target.value)}
              placeholder="e.g. High ceiling requiring ladder, elevator available, bring 16A spare MCB."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#116B63]"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#E2E8F0]">
            <Button
              variant="outline"
              size="md"
              onClick={() => onNavigate('customer-dashboard')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              icon={PlusCircle}
              className="font-bold shadow-md shadow-[#116B63]/20"
            >
              Find Matching Workers
            </Button>
          </div>

        </form>
      </div>

    </div>
  );
}
