import React, { useState, useEffect } from 'react';
import {
  Zap, Wrench, Hammer, Tv, ShieldCheck,
  CheckCircle2, ArrowRight, Award
} from 'lucide-react';
import Button from '../components/common/Button';
import { api } from '../api/client';

export default function LandingPage({ onNavigate, onRegisterAsProfessional, onSelectCategory }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        const catData = await api.categories.list();
        setCategories(catData.results || catData || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    }
    loadData();
  }, []);

  const getCategoryIcon = (iconName) => {
    switch (iconName) {
      case 'Zap': return Zap;
      case 'Wrench': return Wrench;
      case 'Hammer': return Hammer;
      case 'Tv': return Tv;
      default: return Wrench;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#EAF5F1]/70 via-white to-[#F8FAFC] pt-12 pb-20 border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center">
            
            {/* Left Content */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EAF5F1] text-[#0B4945] text-xs font-bold border border-[#16845B]/20">
                <ShieldCheck size={16} className="text-[#16845B] shrink-0" aria-hidden="true" />
                <span>Skills Deserve Opportunity</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#172B2A] tracking-tight leading-[1.12] font-heading">
                Good work deserves to be seen, <br />
                <span className="text-[#116B63]">valued, and trusted.</span>
              </h1>

              <p className="text-base sm:text-lg text-[#64748B] max-w-xl leading-relaxed">
                SAMARTH brings customers and skilled local professionals together through transparent service quotes, skill-based matching, and opportunities to build lasting trust.
              </p>

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="primary"
                  size="lg"
                  icon={ArrowRight}
                  iconPosition="right"
                  onClick={() => onNavigate('create-request')}
                >
                  Find a Professional
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={onRegisterAsProfessional}
                >
                  Join as a Professional
                </Button>
              </div>

              {/* Trust Micro-Metrics */}
              <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-[#64748B]">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-[#16845B] shrink-0" aria-hidden="true" />
                  <span>Government ID Verified</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-[#16845B] shrink-0" aria-hidden="true" />
                  <span>Itemized Quotes Before Booking</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-[#16845B] shrink-0" aria-hidden="true" />
                  <span>Fair Rule-Based Matching</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* POPULAR SERVICES SECTION */}
      <section id="services" className="py-20 bg-white border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-extrabold text-[#172B2A] tracking-tight font-heading">
              Popular Services
            </h2>
            <p className="text-base text-[#64748B] mt-2">
              All jobs are powered by transparent itemized estimates and verified local technicians.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat) => {
              const Icon = getCategoryIcon(cat.icon);
              return (
                <div
                  key={cat.id}
                  onClick={() => {
                    onSelectCategory(cat.slug);
                    onNavigate('create-request');
                  }}
                  className="group relative bg-[#F8FAFC] hover:bg-white rounded-2xl p-6 border border-[#E2E8F0] hover:border-[#116B63]/40 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-[#EAF5F1] text-[#116B63] group-hover:bg-[#116B63] group-hover:text-white transition-colors flex items-center justify-center mb-5 shrink-0">
                      <Icon size={24} className="shrink-0" aria-hidden="true" />
                    </div>
                    <h3 className="text-lg font-bold text-[#172B2A] group-hover:text-[#116B63] transition-colors mb-2">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-[#64748B] leading-relaxed mb-4">
                      {cat.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#172B2A]">
                      From ₹{parseInt(cat.base_price_min)} - ₹{parseInt(cat.base_price_max)}
                    </span>
                    <span className="text-[#116B63] font-bold inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Book <ArrowRight size={14} className="shrink-0" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-20 bg-[#F8FAFC] border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-[#116B63] uppercase tracking-wider">
              Simple & Transparent
            </span>
            <h2 className="text-3xl font-extrabold text-[#172B2A] tracking-tight mt-1 font-heading">
              How SAMARTH Works
            </h2>
            <p className="text-base text-[#64748B] mt-2">
              Fair for customers, empowering for workers. No hidden commissions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-7 rounded-2xl border border-[#E2E8F0] shadow-2xs relative">
              <div className="w-10 h-10 rounded-xl bg-[#EAF5F1] text-[#116B63] font-black text-sm flex items-center justify-center mb-5">
                01
              </div>
              <h3 className="text-lg font-bold text-[#172B2A] mb-2">Describe Your Task</h3>
              <p className="text-sm text-[#64748B] leading-relaxed">
                Choose the service category, your locality, preferred time slot, and budget. No upfront payment required.
              </p>
            </div>

            <div className="bg-white p-7 rounded-2xl border border-[#E2E8F0] shadow-2xs relative">
              <div className="w-10 h-10 rounded-xl bg-[#EAF5F1] text-[#116B63] font-black text-sm flex items-center justify-center mb-5">
                02
              </div>
              <h3 className="text-lg font-bold text-[#172B2A] mb-2">Fair Match & Clear Quotes</h3>
              <p className="text-sm text-[#64748B] leading-relaxed">
                Our rule-based engine scores workers based on skill, proximity, availability and budget compatibility. Workers submit transparent itemized quotes.
              </p>
            </div>

            <div className="bg-white p-7 rounded-2xl border border-[#E2E8F0] shadow-2xs relative">
              <div className="w-10 h-10 rounded-xl bg-[#EAF5F1] text-[#116B63] font-black text-sm flex items-center justify-center mb-5">
                03
              </div>
              <h3 className="text-lg font-bold text-[#172B2A] mb-2">Confirmed Service & Review</h3>
              <p className="text-sm text-[#64748B] leading-relaxed">
                Approve a quote to confirm the booking, track its status through completion, and leave a review.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* DUAL VALUE PROPOSITION */}
      <section id="for-workers" className="py-20 bg-white border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* For Customers */}
            <div className="p-8 bg-slate-50 rounded-3xl border border-[#E2E8F0] flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#116B63]">For Households</span>
                <h3 className="text-2xl font-bold text-[#172B2A] mt-2 mb-4 font-heading">
                  Why Customers Trust SAMARTH
                </h3>
                <ul className="space-y-3.5 text-sm text-[#64748B] mb-8">
                  <li className="flex items-start gap-3">
                    <ShieldCheck size={18} className="text-[#16845B] shrink-0 mt-0.5" />
                    <span><strong>Admin-reviewed verification:</strong> Worker documents and trade experience are reviewed before a verified badge is awarded.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 size={18} className="text-[#16845B] shrink-0 mt-0.5" />
                    <span><strong>Locked Quotes:</strong> Transparent breakdown of labour, materials, and additional costs. No surprise price hikes.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Award size={18} className="text-[#16845B] shrink-0 mt-0.5" />
                    <span><strong>Explainable Scoring:</strong> Understand exactly why a worker is recommended (proximity, skill fit, budget).</span>
                  </li>
                </ul>
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={() => onNavigate('create-request')}
              >
                Post Service Request
              </Button>
            </div>

            {/* For Workers */}
            <div className="p-8 bg-[#EAF5F1]/50 rounded-3xl border border-[#116B63]/20 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#0B4945]">For Skilled Tradespeople</span>
                <h3 className="text-2xl font-bold text-[#172B2A] mt-2 mb-4 font-heading">
                  Why Workers Prosper with SAMARTH
                </h3>
                <ul className="space-y-3.5 text-sm text-[#172B2A]/80 mb-8">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 size={18} className="text-[#116B63] shrink-0 mt-0.5" />
                    <span><strong>Local job opportunities:</strong> Find service requests in your area and connect directly with customers.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 size={18} className="text-[#116B63] shrink-0 mt-0.5" />
                    <span><strong>Control Your Quotes:</strong> Submit your own prices for labour and parts. You decide what your craft is worth.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 size={18} className="text-[#116B63] shrink-0 mt-0.5" />
                    <span><strong>Build your reputation:</strong> A verified profile and customer reviews can help strengthen your local credibility.</span>
                  </li>
                </ul>
              </div>
              <Button
                variant="secondary"
                size="md"
                onClick={onRegisterAsProfessional}
                className="bg-[#116B63] text-white hover:bg-[#0B4945]"
              >
                Register as a Skilled Worker
              </Button>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
