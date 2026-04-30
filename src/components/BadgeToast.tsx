import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getBadgeDefinition } from '../services/badgeService';
import { BadgeId } from '../types';

interface Props {
  newBadges: BadgeId[];
  onDismiss: () => void;
}

export default function BadgeToast({ newBadges, onDismiss }: Props) {
  const [index, setIndex] = useState(0);
  const badge = getBadgeDefinition(newBadges[index]);

  useEffect(() => {
    if (!badge) return;
    const timer = setTimeout(() => {
      if (index < newBadges.length - 1) {
        setIndex(i => i + 1);
      } else {
        onDismiss();
      }
    }, 3500);
    return () => clearTimeout(timer);
  }, [index, badge]);

  if (!badge) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 80, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
      >
        <div className="bg-[--ink] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[300px]">
          <div className="w-12 h-12 rounded-xl bg-[--accent] flex items-center justify-center text-2xl shrink-0">
            {badge.icon}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[--accent]">Badge verdiend!</p>
            <p className="font-bold text-white">{badge.name}</p>
            <p className="text-xs text-white/60 mt-0.5">{badge.description}</p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
