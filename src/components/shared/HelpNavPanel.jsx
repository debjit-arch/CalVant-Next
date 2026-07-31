"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, BookOpen, LifeBuoy, ChevronRight } from "lucide-react";

/**
 * HelpNavPanel
 *
 * Replaces the old "Help" modal with a slide-in left panel offering exactly
 * two entry points:
 *   1. Help Center       → opens the knowledge base in a new tab (/help-center)
 *   2. Support & Tickets → placeholder, no backend yet
 */
const HelpNavPanel = ({ open, onClose }) => {
  const handleHelpCenter = () => {
    window.open("/help-center", "_blank", "noopener,noreferrer");
    onClose?.();
  };

  const handleSupportTickets = () => {
    // Backend not built yet — intentionally a no-op for now.
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-slate-900/30 z-[1200]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.aside
            className="fixed top-0 left-0 h-full w-[320px] sm:w-[360px] bg-white z-[1201] shadow-[8px_0_30px_rgba(15,23,42,0.15)] flex flex-col"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
          >
            <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Need help?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  We've got everything you need right here.
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0"
              >
                <X size={16} className="text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
              <button
                onClick={handleHelpCenter}
                className="w-full flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors text-left group"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                  <BookOpen size={16} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-800">Help Center</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Find answers and module guides in our knowledge base.
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-300 flex-shrink-0 mt-2" />
              </button>

              <button
                onClick={handleSupportTickets}
                className="w-full flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors text-left group"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <LifeBuoy size={16} className="text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-800">Support and Tickets</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Make a request to our support team and find all your tickets.
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-300 flex-shrink-0 mt-2" />
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default HelpNavPanel;
