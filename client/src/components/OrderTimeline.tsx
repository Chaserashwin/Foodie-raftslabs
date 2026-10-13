import React from 'react';
import { CheckCircle2, Clock, Utensils, Bike, PackageCheck } from 'lucide-react';
import { OrderStatus, OrderTimelineItem } from '../types';

interface OrderTimelineProps {
  currentStatus: OrderStatus;
  timeline: OrderTimelineItem[];
}

const STEPS: {
  status: OrderStatus;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    status: 'ORDER_RECEIVED',
    title: 'Order Received',
    description: 'We have received your order and sent it to the kitchen.',
    icon: Clock,
  },
  {
    status: 'PREPARING',
    title: 'Preparing',
    description: 'Our gourmet chefs are cooking your fresh meal.',
    icon: Utensils,
  },
  {
    status: 'OUT_FOR_DELIVERY',
    title: 'Out for Delivery',
    description: 'Your food is in thermal transit with our courier.',
    icon: Bike,
  },
  {
    status: 'DELIVERED',
    title: 'Delivered',
    description: 'Enjoy your freshly delivered gourmet meal!',
    icon: PackageCheck,
  },
];

const STATUS_RANK: Record<OrderStatus, number> = {
  ORDER_RECEIVED: 1,
  PREPARING: 2,
  OUT_FOR_DELIVERY: 3,
  DELIVERED: 4,
};

export const OrderTimeline: React.FC<OrderTimelineProps> = ({ currentStatus, timeline }) => {
  const currentRank = STATUS_RANK[currentStatus] || 1;

  const getTimelineEntry = (status: OrderStatus) => {
    return timeline.find((item) => item.status === status);
  };

  return (
    <div className="py-4">
      {/* Horizontal progress bar for desktop */}
      <div className="relative">
        <div className="space-y-6 md:space-y-8">
          {STEPS.map((step, idx) => {
            const stepRank = STATUS_RANK[step.status];
            const isCompleted = stepRank < currentRank;
            const isCurrent = stepRank === currentRank;
            const isPending = stepRank > currentRank;
            const timelineEntry = getTimelineEntry(step.status);
            const StepIcon = step.icon;

            return (
              <div key={step.status} className="relative flex items-start gap-4 sm:gap-6">
                {/* Connecting line between steps */}
                {idx < STEPS.length - 1 && (
                  <div
                    className={`absolute left-5 sm:left-6 top-11 bottom-[-24px] w-0.5 transition-colors duration-500 ${
                      stepRank < currentRank ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  />
                )}

                {/* Step Icon Badge */}
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 z-10 transition-all duration-300 ${
                    isCompleted
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                      : isCurrent
                      ? 'bg-brand-500 text-white ring-4 ring-brand-100 shadow-md shadow-brand-500/25 animate-pulse'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                  ) : (
                    <StepIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  )}
                </div>

                {/* Step Details */}
                <div className="flex-1 pt-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h4
                      className={`font-black text-sm sm:text-base ${
                        isCurrent
                          ? 'text-brand-600'
                          : isCompleted
                          ? 'text-slate-900'
                          : 'text-slate-400'
                      }`}
                    >
                      {step.title}
                    </h4>

                    {timelineEntry?.timestamp && (
                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md self-start sm:self-auto">
                        {new Date(timelineEntry.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>

                  <p
                    className={`text-xs mt-1 leading-relaxed ${
                      isPending ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    {timelineEntry?.note || step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
