import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ThumbsUp, ShieldCheck, Star } from "lucide-react";
import {
  averageSubscores,
  subscoreLabels,
  type Review,
  type ReviewSubscores,
} from "@/lib/cameroon-data";
import { useTravel } from "@/lib/travel-store";
import { Stars } from "./Stars";
import { PerforatedDivider } from "@/components/manifest/PerforatedDivider";

export function RatingBreakdown({ reviews }: { reviews: Review[] }) {
  const avg = useMemo(() => averageSubscores(reviews), [reviews]);
  const keys = Object.keys(subscoreLabels) as (keyof ReviewSubscores)[];
  const overall = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="grid gap-6 md:grid-cols-[220px_1fr] items-start">
      <div className="flex md:flex-col items-center md:items-start gap-3">
        <div className="flex items-baseline gap-2">
          <Star className="w-6 h-6 fill-beacon-amber text-beacon-amber" />
          <span className="num text-5xl text-departure-navy">{overall.toFixed(2)}</span>
        </div>
        <div>
          <p className="num text-[11px] uppercase tracking-[0.2em] text-ink-60">
            {reviews.length} verified reviews
          </p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] num uppercase tracking-[0.18em] text-horizon-teal">
            <ShieldCheck className="w-3.5 h-3.5" /> Stay-verified
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
        {keys.map((k, i) => (
          <div key={k} className="flex items-center gap-3">
            <span className="text-sm text-ink-60 w-32 shrink-0">{subscoreLabels[k]}</span>
            <div className="flex-1 h-[3px] bg-ink-30/30 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${(avg[k] / 5) * 100}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                className="h-full bg-departure-navy"
              />
            </div>
            <span className="num text-xs text-ink-90 w-9 text-right">{avg[k].toFixed(1)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReviewCard({ review }: { review: Review }) {
  const { helpfulVotes, toggleHelpful } = useTravel();
  const voted = helpfulVotes.includes(review.id);

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="py-6"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 shrink-0 rounded-full bg-runway-sand text-departure-navy grid place-items-center num text-xs">
          {review.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3">
            <p className="font-medium text-ink-90">{review.author}</p>
            <p className="num text-[11px] uppercase tracking-[0.18em] text-ink-60">{review.from}</p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Stars value={review.rating} size={12} />
            <span className="num text-[11px] text-ink-60">{review.date}</span>
          </div>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-90/90">{review.body}</p>

          {review.hostReply && (
            <div className="mt-4 border-l-2 border-beacon-amber pl-4">
              <p className="num text-[10px] uppercase tracking-[0.2em] text-ink-60">Host response</p>
              <p className="text-sm text-ink-90/85 mt-1">{review.hostReply}</p>
            </div>
          )}

          <button
            onClick={() => toggleHelpful(review.id)}
            className={`mt-4 inline-flex items-center gap-2 num text-[11px] uppercase tracking-[0.18em] transition-colors ${
              voted ? "text-horizon-teal" : "text-ink-60 hover:text-ink-90"
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            Helpful · {review.helpful + (voted ? 1 : 0)}
          </button>
        </div>
      </div>
    </motion.article>
  );
}

export function ReviewComposer({
  listingId,
  onSubmit,
}: {
  listingId: string;
  onSubmit: (r: Review) => void;
}) {
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="ticket-stub bg-runway-sand text-center">
        <span className="customs-stamp text-horizon-teal">Review filed</span>
        <p className="mt-3 text-sm text-ink-60">
          Thank you — your review is live at the top of the list.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!body.trim()) return;
        const n = name.trim() || "You";
        onSubmit({
          id: `usr-${Date.now()}`,
          listingId,
          author: n,
          initials: n.slice(0, 2).toUpperCase(),
          from: "Your stay",
          date: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
          rating,
          body: body.trim(),
          subscores: {
            cleanliness: rating, accuracy: rating, checkIn: rating,
            communication: rating, location: rating, value: rating,
          },
          helpful: 0,
        });
        setDone(true);
      }}
      className="ticket-stub bg-cloud-white border border-ink-90/10 space-y-4"
    >
      <div className="flex items-center justify-between">
        <p className="num text-[11px] uppercase tracking-[0.2em] text-ink-60">Write a review</p>
        <Stars value={rating} size={20} interactive onChange={setRating} />
      </div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        className="w-full bg-transparent border-b border-ink-90/15 py-2 text-sm outline-none focus:border-beacon-amber"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        placeholder="What should the next traveller know?"
        className="w-full bg-transparent border-b border-ink-90/15 py-2 text-sm outline-none resize-none focus:border-beacon-amber"
      />
      <button
        type="submit"
        className="w-full bg-departure-navy text-cloud-white num text-[11px] uppercase tracking-[0.22em] py-3 rounded-sm hover:bg-ink-90 transition-colors"
      >
        Submit review
      </button>
    </form>
  );
}

export function ReviewList({ reviews }: { reviews: Review[] }) {
  const [limit, setLimit] = useState(4);
  return (
    <div>
      <div className="divide-y divide-dashed divide-ink-90/12">
        {reviews.slice(0, limit).map((r) => (
          <ReviewCard key={r.id} review={r} />
        ))}
      </div>
      {reviews.length > limit && (
        <>
          <PerforatedDivider />
          <button
            onClick={() => setLimit((l) => l + 6)}
            className="mt-4 w-full border border-ink-90/20 num text-[11px] uppercase tracking-[0.2em] py-3 rounded-sm hover:bg-runway-sand transition-colors"
          >
            Show all {reviews.length} reviews
          </button>
        </>
      )}
      {reviews.length === 0 && (
        <p className="py-8 text-center text-sm text-ink-60">
          No reviews yet — be the first to file one.
        </p>
      )}
    </div>
  );
}
