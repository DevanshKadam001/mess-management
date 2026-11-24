import React from 'react';
import { UtensilsCrossed, Clock, MapPin, Phone, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-100 text-slate-600 mt-16 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-slate-900 text-base">Smart Canteen</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Campus automated food ordering, kitchen prep management & smart ingredient inventory system.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Campus Hygiene Certified</span>
            </div>
          </div>

          {/* Operating Hours */}
          <div className="space-y-2 text-xs">
            <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">
              Operating Hours
            </h4>
            <div className="space-y-1.5 text-slate-500">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-orange-500" />
                <span>Breakfast: 07:30 AM – 11:00 AM</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-orange-500" />
                <span>Lunch: 12:00 PM – 03:30 PM</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-orange-500" />
                <span>Evening Snacks: 04:30 PM – 09:30 PM</span>
              </div>
            </div>
          </div>

          {/* Food Court Locations */}
          <div className="space-y-2 text-xs">
            <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">
              Active Stalls
            </h4>
            <ul className="space-y-1.5 text-slate-500">
              <li className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-orange-500" />
                <span>Annapurna South & North Delights (Counter 1)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-orange-500" />
                <span>Cafe Zest & Quick Bites (SAC Stall 4)</span>
              </li>
            </ul>
          </div>

          {/* Contact / Help */}
          <div className="space-y-2 text-xs">
            <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">
              Canteen Support
            </h4>
            <p className="text-slate-500">Have feedback or special dietary requirements?</p>
            <div className="flex items-center gap-1.5 text-slate-700 font-bold">
              <Phone className="w-3.5 h-3.5 text-orange-500" />
              <span>+91 98765 00000 / ext 404</span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <p>© 2026 Smart Canteen Management System. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with React, TypeScript, Tailwind CSS, Prisma & PostgreSQL/SQLite
          </p>
        </div>
      </div>
    </footer>
  );
};
