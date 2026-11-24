import React from 'react';
import { OrderStatus } from '../types';
import { CheckCircle2, Clock, CookingPot, Utensils, CheckCheck, XCircle, KeyRound } from 'lucide-react';

interface OrderProgressTrackerProps {
  status: OrderStatus;
  pickupOtp?: string;
  cancelledReason?: string | null;
  estimatedMinutes?: number;
}

const STEPS: { key: OrderStatus; label: string; desc: string; icon: any }[] = [
  {
    key: 'PLACED',
    label: 'Order Placed',
    desc: 'Sent to canteen counter',
    icon: Clock,
  },
  {
    key: 'ACCEPTED',
    label: 'Order Accepted',
    desc: 'Vendor confirmed your order',
    icon: CheckCircle2,
  },
  {
    key: 'PREPARING',
    label: 'Cooking / Preparing',
    desc: 'Kitchen is crafting your meal',
    icon: CookingPot,
  },
  {
    key: 'READY',
    label: 'Ready for Collection',
    desc: 'Pickup food at stall counter',
    icon: Utensils,
  },
  {
    key: 'COLLECTED',
    label: 'Completed / Collected',
    desc: 'Enjoy your hot meal!',
    icon: CheckCheck,
  },
];

export const OrderProgressTracker: React.FC<OrderProgressTrackerProps> = ({
  status,
  pickupOtp,
  cancelledReason,
  estimatedMinutes = 15,
}) => {
  if (status === 'CANCELLED') {
    return (
      <div className="p-8 bg-gradient-to-b from-rose-50 to-white border border-rose-200/80 rounded-3xl text-center space-y-3 shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
          <XCircle className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-black text-rose-950">This Order Was Cancelled</h3>
          <p className="text-xs font-semibold text-rose-700 mt-1 max-w-md mx-auto">
            Reason: {cancelledReason || 'Cancelled upon request.'}
          </p>
        </div>
        <div className="inline-block bg-white px-4 py-2 rounded-xl border border-rose-200 text-xs text-slate-700 shadow-2xs font-medium">
          💰 <strong>Payment Note:</strong> Any pre-authorized UPI payment has been released or refunded.
        </div>
      </div>
    );
  }

  const statusOrder = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'COLLECTED'];
  const currentIndex = statusOrder.indexOf(status);

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
      
      {/* Pickup OTP Banner when Ready or Preparing */}
      {pickupOtp && (status === 'READY' || status === 'PREPARING' || status === 'ACCEPTED') && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between ${
          status === 'READY'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900 animate-pulse'
            : 'bg-orange-50 border-orange-200 text-orange-900'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${
              status === 'READY' ? 'bg-emerald-600 text-white' : 'bg-orange-500 text-white'
            }`}>
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider block">
                {status === 'READY' ? '🎉 Your order is ready! Show OTP at counter' : 'Counter Pickup Verification Code'}
              </span>
              <p className="text-xs opacity-80">
                Share this 4-digit code with the vendor to collect your food
              </p>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <span className="text-2xl font-black tracking-widest bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-xs text-slate-900">
              {pickupOtp}
            </span>
          </div>
        </div>
      )}

      {/* Progress Stepper Timeline */}
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-6 right-6 h-1 bg-slate-100 -z-0">
          <div
            className="h-full bg-orange-500 transition-all duration-700 ease-out"
            style={{
              width: `${(currentIndex / (STEPS.length - 1)) * 100}%`,
            }}
          />
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-5 relative z-10">
          {STEPS.map((step, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const Icon = step.icon;

            return (
              <div key={step.key} className="flex flex-col items-center text-center px-1">
                {/* Step Circle */}
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm ${
                    isCompleted
                      ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                      : isCurrent
                      ? 'bg-orange-500 text-white ring-4 ring-orange-100 scale-110 shadow-orange-500/30'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                {/* Step Text */}
                <div className="mt-3">
                  <h4
                    className={`text-xs font-bold leading-tight ${
                      isCurrent
                        ? 'text-orange-600'
                        : isCompleted
                        ? 'text-slate-800'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </h4>
                  <p className="hidden sm:block text-[10px] text-slate-400 mt-0.5 leading-snug">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Step Status Explanation Banner */}
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs text-slate-600">
        <div>
          <span className="font-semibold text-slate-800">Current Status: </span>
          <span className="font-bold text-orange-600">{STEPS[currentIndex]?.label}</span>
          <p className="text-[11px] text-slate-500 mt-0.5">{STEPS[currentIndex]?.desc}</p>
        </div>

        {status !== 'COLLECTED' && (
          <div className="text-right flex-shrink-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Est. Wait</span>
            <span className="font-bold text-slate-800">~{estimatedMinutes} mins</span>
          </div>
        )}
      </div>
    </div>
  );
};
