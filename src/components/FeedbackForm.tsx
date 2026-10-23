'use client';

import React, { useState } from 'react';
import { Star, Send, CheckCircle2 } from 'lucide-react';
import { dataLayer } from '@/lib/data-layer';

export function FeedbackForm({ tokenId, refCode }: { tokenId: string; refCode: string }) {
  const [rating, setRating] = useState(5);
  const [satisfaction, setSatisfaction] = useState<'excellent' | 'acceptable' | 'too_long'>('excellent');
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dataLayer.submitFeedback({
      token_id: tokenId,
      ref_code: refCode,
      rating,
      comment,
      wait_time_satisfaction: satisfaction
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="p-6 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-center">
        <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
        <h4 className="font-bold text-white text-base">Thank you for your feedback!</h4>
        <p className="text-xs text-slate-300 mt-1">Your review helps improve queue efficiency and service quality.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
      <div>
        <h4 className="font-bold text-white text-base">How was your experience today?</h4>
        <p className="text-xs text-slate-400">Please rate the consultation and waiting time.</p>
      </div>

      {/* Star Rating */}
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            type="button"
            key={star}
            onClick={() => setRating(star)}
            className="p-1 text-slate-500 hover:text-amber-400 focus:outline-none transition-colors"
          >
            <Star 
              className={`w-6 h-6 ${
                star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
              }`} 
            />
          </button>
        ))}
        <span className="ml-2 text-xs font-semibold text-amber-400">{rating} / 5 Stars</span>
      </div>

      {/* Wait Time Satisfaction */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1.5">
          Wait Time Satisfaction:
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['excellent', 'acceptable', 'too_long'] as const).map((opt) => (
            <button
              type="button"
              key={opt}
              onClick={() => setSatisfaction(opt)}
              className={`py-1.5 px-2 rounded-lg text-xs font-medium border capitalize transition-all ${
                satisfaction === opt
                  ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800'
              }`}
            >
              {opt.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Comment */}
      <div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Optional notes or feedback for clinic staff..."
          rows={2}
          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
      >
        <Send className="w-3.5 h-3.5" />
        Submit Feedback
      </button>
    </form>
  );
}
