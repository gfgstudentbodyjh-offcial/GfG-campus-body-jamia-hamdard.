import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Copy,
  Check,
  Printer,
  Home,
  Calendar,
  Sparkles,
  ShieldCheck,
  User,
  Users,
  Award,
  ExternalLink,
  MessageCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RegistrationSuccessModal({ registration, onReset }) {
  const [copied, setCopied] = useState(false);

  if (!registration) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(registration.registrationId || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-3xl mx-auto w-full space-y-6"
    >
      {/* Success Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#22A447]/15 border border-[#22A447]/30 text-[#22A447] shadow-md mx-auto">
          <CheckCircle2 className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#171F1B] border border-[#28342D] text-[#22A447] text-xs font-medium">
            Official Registration Confirmed
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F5F7F5] tracking-tight">
            Team Successfully Registered
          </h2>
          <p className="text-[#A2ADA6] text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
            Your team entry has been recorded for THINKTANK Ideathon 2026 under the 5G Use Case Lab at GeeksforGeeks Campus Body, Jamia Hamdard.
          </p>
        </div>
      </div>

      {/* Official Registration Pass */}
      <div className="relative rounded-2xl bg-[#121916] border border-[#28342D] shadow-xl overflow-hidden print:border print:border-black print:bg-white print:text-black">
        {/* Top Header Strip */}
        <div className="p-4 sm:p-7 border-b border-[#28342D] bg-[#171F1B] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-14 h-14 rounded-xl bg-white p-1.5 border border-[#28342D] flex items-center justify-center flex-shrink-0 shadow-sm">
              <img
                src="/assets/gfg-official-logo.png"
                alt="GFG Campus Body Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#A2ADA6]">
                <span className="font-medium text-[#22A447]">GFG Campus Body</span>
                <span>•</span>
                <span>Jamia Hamdard</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#F5F7F5] mt-0.5 truncate">
                {registration.eventName || 'THINKTANK IDEATHON 2026'}
              </h3>
              <span className="text-[11px] text-[#A2ADA6] block">
                Under 5G Use Case Lab
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:items-end">
            <span className="text-[11px] text-[#707E75] uppercase tracking-wider">
              Registration Pass ID
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-sm sm:text-base font-bold text-[#22A447] px-2.5 py-1 rounded-md bg-[#121916] border border-[#28342D]">
                {registration.registrationId}
              </span>
              <button
                type="button"
                onClick={handleCopyId}
                title="Copy Registration ID"
                className="p-1.5 rounded-md bg-[#121916] border border-[#28342D] text-[#A2ADA6] hover:text-[#F5F7F5] hover:border-[#22A447] transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#22A447]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Ticket Body Grid */}
        <div className="p-4 sm:p-8 space-y-6">
          {/* Key Metas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            <div className="p-3.5 rounded-lg bg-[#171F1B] border border-[#28342D]">
              <span className="text-[11px] text-[#707E75] block">Team Name</span>
              <span className="text-sm font-semibold text-[#F5F7F5] mt-0.5 block truncate">
                {registration.teamName}
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-[#171F1B] border border-[#28342D]">
              <span className="text-[11px] text-[#707E75] block">Category Track</span>
              <span className="text-sm font-semibold text-[#22A447] mt-0.5 block truncate">
                {registration.category}
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-[#171F1B] border border-[#28342D]">
              <span className="text-[11px] text-[#707E75] block">Total Members</span>
              <span className="text-sm font-semibold text-[#F5F7F5] mt-0.5 block">
                {registration.teamSize} Members
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-[#171F1B] border border-[#28342D]">
              <span className="text-[11px] text-[#707E75] block">Faculty Mentor</span>
              <span className="text-sm font-semibold text-[#F5F7F5] mt-0.5 block truncate">
                {registration.facultyMentor}
              </span>
            </div>
          </div>

          {/* Leader and Members List */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-[#A2ADA6] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#22A447]" /> Team Composition
            </h4>

            <div className="space-y-2">
              {/* Leader Card */}
              <div className="p-3 rounded-lg bg-[#171F1B] border border-[#28342D] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded bg-[#22A447]/15 text-[#22A447] text-xs font-semibold flex items-center justify-center flex-shrink-0">
                    L
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[#F5F7F5] flex items-center gap-2">
                      {registration.leader?.name}
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#22A447]/20 text-[#22A447] font-medium">
                        Leader
                      </span>
                    </div>
                    <div className="text-[11px] text-[#707E75]">
                      {registration.leader?.email} • {registration.leader?.mobile}
                    </div>
                  </div>
                </div>
                <div className="text-[11px] text-[#A2ADA6] sm:text-right">
                  {registration.leader?.department}
                </div>
              </div>

              {/* Other Members */}
              {registration.members?.map((mem) => (
                <div
                  key={mem.memberIndex || mem.email}
                  className="p-3 rounded-lg bg-[#171F1B] border border-[#28342D] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-[#121916] text-[#707E75] text-xs font-medium flex items-center justify-center flex-shrink-0">
                      {mem.memberIndex}
                    </div>
                    <div>
                      <div className="text-xs font-medium text-[#F5F7F5]">
                        {mem.name}
                      </div>
                      <div className="text-[11px] text-[#707E75]">
                        {mem.email} • {mem.mobile}
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] text-[#707E75] sm:text-right">
                    {mem.department}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Notice */}
          <div className="p-3.5 rounded-lg bg-[#171F1B] border border-[#28342D] flex items-center gap-3 text-xs text-[#A2ADA6]">
            <Award className="w-4 h-4 text-[#22A447] flex-shrink-0" />
            <div>
              <p className="text-[#F5F7F5] font-medium">Recorded in University Database</p>
              <p className="text-[11px] text-[#707E75]">
                Official participant entry confirmed under the Jamia Hamdard 5G Use Case Lab.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Official WhatsApp Group for Team Leaders & Participants */}
      <div className="rounded-2xl p-6 bg-[#121916] border border-[#28342D] shadow-xl print:hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#25D366]/15 border border-[#25D366]/30 flex items-center justify-center text-[#25D366] flex-shrink-0">
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.888 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c-.001 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.48-8.413z" />
              </svg>
            </div>
            <div>
              <span className="text-[11px] font-medium text-[#25D366] block">
                IMPORTANT FOR TEAM LEADERS
              </span>
              <h3 className="text-sm sm:text-base font-bold text-[#F5F7F5]">
                Official Ideathon WhatsApp Group
              </h3>
              <p className="text-xs text-[#A2ADA6] mt-0.5">
                Join for round schedules, problem statement releases, and mentor announcements.
              </p>
            </div>
          </div>

          <a
            href="https://chat.whatsapp.com/FBOMzvQOl2t1YhIQDnYlnL?s=sh&p=a&mlu=4&ilr=4"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 rounded-lg bg-[#25D366] hover:bg-[#20BA5A] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-all flex-shrink-0"
          >
            <span>Join WhatsApp Group</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 print:hidden">
        <button
          type="button"
          onClick={handlePrint}
          className="px-4 py-2.5 rounded-lg bg-[#171F1B] hover:bg-[#1E2924] border border-[#28342D] text-xs sm:text-sm font-medium text-[#F5F7F5] flex items-center gap-2 transition-all"
        >
          <Printer className="w-4 h-4 text-[#22A447]" /> Print Registration Pass
        </button>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onReset}
            className="px-4 py-2.5 rounded-lg bg-[#171F1B] hover:bg-[#1E2924] border border-[#28342D] text-xs sm:text-sm font-medium text-[#A2ADA6] hover:text-[#F5F7F5] transition-all"
          >
            Register Another Team
          </button>
          <Link
            to="/"
            className="px-4 py-2.5 rounded-lg bg-[#22A447] hover:bg-[#1E943F] text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Home className="w-4 h-4" /> Return to Home
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
