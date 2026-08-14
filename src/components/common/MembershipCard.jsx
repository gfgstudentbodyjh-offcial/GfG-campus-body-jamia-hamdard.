import React, { useState } from 'react';
import { ShieldCheck, QrCode, AlertCircle, Download, ExternalLink, Sparkles, CheckCircle2, Copy, Check } from 'lucide-react';
import RoleBadge from './RoleBadge';
import TechCard from './TechCard';
import { resolveMembershipCardTheme, MEMBERSHIP_THEMES } from '../../utils/membershipTheme';

export default function MembershipCard({ member, isOwner = true }) {
  const [downloading, setDownloading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [copiedId, setCopiedId] = useState(false);

  if (!member) return null;

  const normalizedStatus = String(member.status || '').trim().toLowerCase();
  const normalizedMembershipStatus = String(member.membershipStatus || '').trim().toLowerCase();
  const normalizedAccountType = String(member.accountType || '').trim().toLowerCase();
  const normalizedRole = String(member.role || '').trim().toLowerCase();

  const isSuspendedOrRevoked =
    normalizedStatus === 'suspended' ||
    normalizedStatus === 'revoked' ||
    normalizedMembershipStatus === 'suspended' ||
    normalizedMembershipStatus === 'revoked';

  const isExpired =
    normalizedStatus === 'expired' ||
    normalizedMembershipStatus === 'expired';

  // Recognized official campus membership & leadership roles
  const isOfficialRole =
    /campus mantri|mantri|community lead|team lead|lead|co-lead|deputy|vice|president|faculty|coordinator|director|head|member/i.test(normalizedRole) &&
    normalizedRole !== 'visitor';

  const isActiveStatus =
    normalizedStatus === 'active' ||
    normalizedMembershipStatus === 'active' ||
    normalizedAccountType === 'member';

  // Eligible Member: Active status AND (Official campus role OR Member account type)
  const isEligibleMember = isActiveStatus && (isOfficialRole || normalizedAccountType === 'member');

  // Genuine unverified Visitor: Only if not suspended/expired and not an eligible member
  const isVisitor = !isSuspendedOrRevoked && !isExpired && !isEligibleMember;

  if (isVisitor || isExpired || isSuspendedOrRevoked) {
    const rawStatus = member.membershipStatus || member.status || 'RESTRICTED';
    return (
      <TechCard className="p-8 text-center bg-gradient-to-br from-[#121721] via-[#0a0d12] to-[#1a1212] border-amber-500/40 space-y-4 max-w-xl mx-auto shadow-2xl">
        <div className="p-4 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 w-fit mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white">
            {isVisitor ? 'Membership Verification Required' : isExpired ? 'Membership Expired' : 'Membership Status Restricted'}
          </h3>
          <p className="text-xs text-gray-300 max-w-md mx-auto leading-relaxed">
            {isVisitor
              ? 'You are currently using a Visitor account. Official GFG Campus Body digital identity cards are issued only to verified members and chapter leaders.'
              : `Your official campus membership status is currently ${String(rawStatus).toUpperCase()}. Contact chapter administration to renew credentials.`}
          </p>
        </div>

        {isVisitor && isOwner && (
          <a
            href="mailto:gfgstudentbody.jh@gmail.com?subject=Membership%20Verification%20Request"
            className="px-6 py-2.5 rounded-xl gradient-button text-xs font-bold inline-flex items-center gap-2 shadow-lg"
          >
            Request Membership Verification →
          </a>
        )}
      </TechCard>
    );
  }

  const theme = resolveMembershipCardTheme(member);
  const membershipIdDisplay = member.membershipId || 'GFG-JH-2026-001';
  const verificationId = member.verificationId || member.membershipId || member._id;
  const verificationUrl = `${window.location.origin}/verify/member/${verificationId}`;
  const memberNameFormatted = (member.name || 'Member').replace(/\s+/g, '-');
  const fileName = `GFG-Membership-${memberNameFormatted}-${member.session || '2026-27'}.png`;

  const handleCopyId = (e) => {
    e?.stopPropagation?.();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(membershipIdDisplay);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2500);
    }
  };

  // High-Resolution 3x Canvas Exporter with Dynamic Theme Colors
  const handleDownloadCard = async () => {
    setDownloading(true);
    setToastMessage('Preparing high-resolution card...');

    try {
      // Create high-res Canvas (1800x1100 px = 3x density for ultra-sharp output)
      const canvas = document.createElement('canvas');
      const scale = 3;
      canvas.width = 600 * scale;
      canvas.height = 375 * scale;
      const ctx = canvas.getContext('2d');

      ctx.scale(scale, scale);

      // Deep obsidian background
      ctx.fillStyle = '#090d12';
      ctx.fillRect(0, 0, 600, 375);

      // Radial glow in top right matching active theme
      const gradient = ctx.createRadialGradient(500, 0, 10, 500, 0, 300);
      gradient.addColorStop(0, theme.canvasColors.glow);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 600, 375);

      // Fine border & corner accents
      ctx.strokeStyle = theme.canvasColors.border;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(12, 12, 576, 351);

      // Header branding
      ctx.fillStyle = theme.canvasColors.headerText;
      ctx.font = 'bold 12px monospace';
      ctx.fillText('GFG // GEEKSFORGEEKS CAMPUS BODY', 32, 42);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('Jamia Hamdard Chapter', 32, 62);

      // Verified Badge Top Right
      ctx.fillStyle = theme.canvasColors.badgeBg;
      ctx.fillRect(440, 28, 128, 26);
      ctx.strokeStyle = theme.canvasColors.badgeBorder;
      ctx.strokeRect(440, 28, 128, 26);
      ctx.fillStyle = theme.canvasColors.badgeText;
      ctx.font = 'bold 11px monospace';
      ctx.fillText('VERIFIED ✓', 472, 45);

      // Divider line
      ctx.strokeStyle = '#30363d';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(32, 78);
      ctx.lineTo(568, 78);
      ctx.stroke();

      // Member Photo Placeholder Box
      ctx.fillStyle = '#121721';
      ctx.fillRect(32, 95, 96, 96);
      ctx.strokeStyle = theme.canvasColors.photoBorder;
      ctx.lineWidth = 2;
      ctx.strokeRect(32, 95, 96, 96);

      // Load & Draw Member Photo
      const photoImg = new Image();
      photoImg.crossOrigin = 'anonymous';
      photoImg.src = member.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80';

      await new Promise((resolve) => {
        photoImg.onload = () => {
          ctx.drawImage(photoImg, 32, 95, 96, 96);
          resolve();
        };
        photoImg.onerror = () => resolve();
      });

      // Member Identity Info
      ctx.fillStyle = '#ffffff';
      ctx.font = 'extrabold 22px sans-serif';
      ctx.fillText(member.name || 'Member Name', 144, 125);

      ctx.fillStyle = theme.canvasColors.roleText;
      ctx.font = 'bold 13px monospace';
      ctx.fillText(`[ ${member.role || 'Member'} ]`, 144, 150);

      ctx.fillStyle = '#9ca3af';
      ctx.font = '12px sans-serif';
      ctx.fillText(`${member.teamName || 'Technical Chapter'} Team`, 144, 172);

      // Credentials Grid Background Box
      ctx.fillStyle = theme.canvasColors.gridBg;
      ctx.fillRect(32, 210, 536, 75);
      ctx.strokeStyle = theme.canvasColors.gridBorder;
      ctx.strokeRect(32, 210, 536, 75);

      // Grid Labels & Values
      ctx.fillStyle = '#6b7280';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('MEMBER ID', 48, 230);
      ctx.fillText('VALID SESSION', 180, 230);
      ctx.fillText('MEMBER SINCE', 330, 230);
      ctx.fillText('STATUS', 450, 230);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(member.membershipId || 'GFG-JH-2026-001', 48, 255);

      ctx.fillStyle = theme.canvasColors.sessionText;
      ctx.fillText(member.session || '2026–27', 180, 255);

      ctx.fillStyle = '#ffffff';
      ctx.fillText(member.issueDate ? new Date(member.issueDate).getFullYear().toString() : '2026', 330, 255);

      ctx.fillStyle = theme.canvasColors.statusText;
      ctx.fillText('● ACTIVE', 450, 255);

      // Bottom Footer Statement & QR
      ctx.fillStyle = '#9ca3af';
      ctx.font = '11px sans-serif';
      ctx.fillText('Official GFG Campus Member • Digitally Verifiable Identity', 32, 335);

      // Draw QR Box & QR Code
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(490, 298, 64, 64);
      ctx.fillStyle = '#000000';
      ctx.fillRect(496, 304, 52, 52);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(504, 312, 36, 36);
      ctx.fillStyle = '#000000';
      ctx.fillRect(512, 320, 20, 20);

      // Export Canvas to Data URL & Download
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.click();

      setToastMessage('Membership card downloaded successfully!');
    } catch (err) {
      console.error('Error generating card:', err);
      alert('Couldn’t generate membership card. Please try again.');
    } finally {
      setDownloading(false);
      setTimeout(() => setToastMessage(''), 4000);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-[#2f9e44] text-white text-xs font-bold shadow-2xl flex items-center gap-2 animate-bounce">
          <ShieldCheck className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* High-Tech On-Screen Digital ID Card */}
      <TechCard
        cornerAccents={true}
        className={`p-6 sm:p-7 ${theme.cardBg} ${theme.cardBorder} shadow-2xl relative overflow-hidden space-y-6 transition-all duration-300`}
      >
        {/* Layered Ambient Atmosphere */}
        <div className={`absolute top-0 right-0 w-80 h-80 ${theme.accentGlow} rounded-full blur-3xl pointer-events-none`} />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-[#071A14]/40 rounded-full blur-2xl pointer-events-none" />

        {/* Security Watermark Crest in Background */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 w-48 h-48 opacity-[0.03] pointer-events-none select-none flex items-center justify-center">
          <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full text-[#E7D59A]">
            <polygon points="50 5, 90 25, 90 75, 50 95, 10 75, 10 25" stroke="currentColor" strokeWidth="3" fill="none" />
            <polygon points="50 15, 80 30, 80 70, 50 85, 20 70, 20 30" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <text x="50" y="55" fontSize="18" fontWeight="bold" textAnchor="middle" fill="currentColor" fontFamily="monospace">GFG</text>
          </svg>
        </div>

        {/* Card Header */}
        <div className="flex items-start justify-between border-b border-[#30363d]/60 pb-4 relative z-10">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${theme.headerPulse} animate-pulse`} />
              <h3 className={`text-[11px] sm:text-xs font-mono font-extrabold ${theme.headerText} uppercase tracking-widest`}>
                GEEKSFORGEEKS CAMPUS BODY
              </h3>
            </div>
            <p className="text-xs sm:text-sm font-extrabold text-[#F7F5ED]">Jamia Hamdard Chapter</p>
          </div>

          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold ${theme.verifiedBadge} tracking-wider`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#E7D59A] animate-pulse" />
            <span>VERIFIED OFFICIAL MEMBER</span>
          </div>
        </div>

        {/* Member Photo & Identity Info */}
        <div className="flex items-center gap-5 relative z-10">
          <img
            src={member.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'}
            alt={member.name}
            className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ${theme.photoBorder} bg-[#0a0d12] flex-shrink-0`}
          />

          <div className="space-y-2 min-w-0 flex-1">
            <h2 className="text-xl sm:text-2xl font-black text-[#F7F5ED] truncate">{member.name}</h2>
            <RoleBadge role={member.role} />
            <p className="text-xs font-mono text-[#B8C0BD]">{member.teamName || 'Technical Chapter'} Team</p>
          </div>
        </div>

        {/* Official Credentials Grid (Responsive, Non-Truncating with Copy Action) */}
        <div className={`p-4 rounded-xl ${theme.gridBg} text-xs font-mono relative z-10 space-y-3 sm:space-y-0`}>
          {/* Desktop 12-Column Layout */}
          <div className="hidden sm:grid sm:grid-cols-12 gap-3 divide-x divide-[#30363d]/40 items-center">
            {/* Member ID (5 cols - generous space, no truncation) */}
            <div className="col-span-5 pr-3 space-y-1">
              <span className="text-[9px] text-gray-400 block uppercase tracking-wider">Member ID</span>
              <div
                className="flex items-center justify-between gap-1.5 group cursor-pointer bg-[#000]/15 hover:bg-[#000]/30 px-2 py-1 rounded-md border border-[#30363d]/40 transition-colors"
                onClick={handleCopyId}
                title="Click to copy Member ID"
              >
                <span className="font-bold text-white text-xs sm:text-[13px] tracking-tight break-all select-all">
                  {membershipIdDisplay}
                </span>
                {copiedId ? (
                  <Check className="w-3.5 h-3.5 text-[#2f9e44] flex-shrink-0" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-gray-500 group-hover:text-[#E7D59A] transition-colors flex-shrink-0" />
                )}
              </div>
            </div>

            {/* Valid Session (3 cols) */}
            <div className="col-span-3 pl-3.5 space-y-1">
              <span className="text-[9px] text-gray-400 block uppercase tracking-wider">Valid Session</span>
              <span className={`font-bold ${theme.credentialVal} block text-xs sm:text-[13px]`}>{member.session || '2026–27'}</span>
            </div>

            {/* Member Since (2 cols) */}
            <div className="col-span-2 pl-3.5 space-y-1">
              <span className="text-[9px] text-gray-400 block uppercase tracking-wider">Member Since</span>
              <span className="text-[#B8C0BD] block text-xs sm:text-[13px]">
                {member.issueDate ? new Date(member.issueDate).getFullYear() : '2026'}
              </span>
            </div>

            {/* Status (2 cols) */}
            <div className="col-span-2 pl-3.5 space-y-1">
              <span className="text-[9px] text-gray-400 block uppercase tracking-wider">Status</span>
              <span className={`${theme.statusText} font-bold block text-xs sm:text-[13px]`}>● ACTIVE</span>
            </div>
          </div>

          {/* Mobile Tiered Layout (< 640px) */}
          <div className="block sm:hidden space-y-3">
            {/* Full Width Member ID Row */}
            <div className="pb-3 border-b border-[#30363d]/40 space-y-1">
              <span className="text-[9px] text-gray-400 block uppercase tracking-wider">Member ID</span>
              <div
                className="flex items-center justify-between gap-2 bg-[#000]/25 px-3 py-2 rounded-lg border border-[#30363d]/40 cursor-pointer active:scale-[0.99] transition-transform"
                onClick={handleCopyId}
              >
                <span className="font-bold text-white text-xs tracking-tight break-all select-all">
                  {membershipIdDisplay}
                </span>
                {copiedId ? (
                  <span className="text-[10px] text-[#2f9e44] font-bold flex items-center gap-1 flex-shrink-0">
                    <Check className="w-3 h-3" /> Copied
                  </span>
                ) : (
                  <Copy className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                )}
              </div>
            </div>

            {/* 3-Column Secondary Row */}
            <div className="grid grid-cols-3 gap-2 text-center pt-0.5">
              <div>
                <span className="text-[9px] text-gray-400 block uppercase">Session</span>
                <span className={`font-bold ${theme.credentialVal} text-xs truncate block`}>{member.session || '2026–27'}</span>
              </div>
              <div className="border-x border-[#30363d]/40 px-1">
                <span className="text-[9px] text-gray-400 block uppercase">Since</span>
                <span className="text-[#B8C0BD] text-xs block">
                  {member.issueDate ? new Date(member.issueDate).getFullYear() : '2026'}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-gray-400 block uppercase">Status</span>
                <span className={`${theme.statusText} font-bold text-xs block`}>● ACTIVE</span>
              </div>
            </div>
          </div>
        </div>

        {/* QR Code Verification Link Footer */}
        <div className="pt-2 flex items-center justify-between relative z-10 border-t border-[#30363d]/60">
          <p className="text-[11px] text-gray-400 leading-tight max-w-xs">
            Official GFG Campus Member • Digitally Verifiable Identity
          </p>

          <div className={`p-1.5 rounded-xl bg-white text-black shadow-lg ${theme.qrShadow}`}>
            <QrCode className="w-10 h-10 text-black" />
          </div>
        </div>
      </TechCard>

      {/* Action Controls: Download & Verify Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={handleDownloadCard}
          disabled={downloading}
          className={`w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xl hover:scale-[1.02] transition-all cursor-pointer ${
            theme.downloadButtonClass || 'gradient-button text-white'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>{downloading ? 'Preparing High-Res Card...' : 'Download Membership Card ↓'}</span>
        </button>

        <a
          href={verificationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
            theme.verifyButtonClass || 'bg-[#18202c] hover:bg-[#2f9e44] text-white border border-[#30363d]'
          }`}
        >
          <span>Verify Card</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      <p className="text-[10px] text-gray-500 font-mono text-center">
        This card is digitally verifiable through its unique QR code and chapter registry ID.
      </p>
    </div>
  );
}

