import React from 'react';
import { Wrench, Heart, ShieldCheck, Phone, Mail, MapPin } from 'lucide-react';

export default function Footer({ onNavigate, onRegisterAsProfessional }) {
  return (
    <footer className="bg-[#172B2A] text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#116B63] text-white flex items-center justify-center shrink-0">
                <Wrench size={18} className="shrink-0" aria-hidden="true" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white font-heading">
                SAM<span className="text-[#38B2AC]">ARTH</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Connecting local households with verified independent electricians, plumbers, carpenters, and technicians with transparent pricing.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300 border border-slate-700">
              <ShieldCheck size={15} className="text-[#38B2AC] shrink-0" aria-hidden="true" />
              <span>Competition Working Prototype</span>
            </div>
          </div>

          {/* Customer Services */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Household Services
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><a href="#services" className="hover:text-white transition-colors">Electrician Services</a></li>
              <li><a href="#services" className="hover:text-white transition-colors">Plumbing & Sanitary</a></li>
              <li><a href="#services" className="hover:text-white transition-colors">Carpentry & Assembly</a></li>
              <li><a href="#services" className="hover:text-white transition-colors">Appliance Repair</a></li>
            </ul>
          </div>

          {/* For Workers */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              For Skilled Workers
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><button onClick={onRegisterAsProfessional} className="hover:text-white transition-colors text-left">Join as a Professional</button></li>
              <li><button onClick={() => onNavigate('login')} className="hover:text-white transition-colors text-left">Worker Dashboard</button></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">Transparent Quotes</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">Fair Match Engine</a></li>
            </ul>
          </div>

          {/* Contact / Locality */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Platform Support
            </h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-center gap-2.5">
                <MapPin size={16} className="text-[#38B2AC] shrink-0" aria-hidden="true" />
                <span>Koramangala, Bangalore, KA</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone size={16} className="text-[#38B2AC] shrink-0" aria-hidden="true" />
                <span>+91 80 4900 1200</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail size={16} className="text-[#38B2AC] shrink-0" aria-hidden="true" />
                <span>support@samarth.in</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} SAMARTH. Built for community impact & fair blue-collar empowerment.</p>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Designed with</span>
            <Heart size={14} className="text-rose-500 shrink-0 fill-rose-500" aria-hidden="true" />
            <span>for verified Indian tradespeople</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
