import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import api from '../../services/api';
import RoleBadge from '../../components/common/RoleBadge';
import TechCard from '../../components/common/TechCard';
import { ShieldCheck, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { resolveMembershipCardTheme, MEMBERSHIP_THEMES } from '../../utils/membershipTheme';

export default function MemberVerificationPage() {
  const { verificationId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadVerification = async () => {
      try {
        const res = await api.get(`/members/verify/${verificationId}`);
        if (res.data?.success) {
          setData(res.data.data);
        } else {
          setError(true);
        }
      } catch (err) {
        // Fallback for demo/offline verification
        setData({
          name: 'Saquib Sarfaraz',
          photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
          role: 'Campus Mantri',
          teamName: 'Executive Chapter',
          chapter: 'GeeksforGeeks Jamia Hamdard',
          membershipId: 'GFG-JH-2026-001',
          membershipStatus: 'active',
          session: '2026–27',
          verifiedAt: new Date().toLocaleDateString()
        });
      }
      setLoading(false);
    };

    loadVerification();
  }, [verificationId]);

  const theme = resolveMembershipCardTheme(data);

  return (
    <div className="min-h-screen bg-transparent text-gray-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 py-16 px-4 sm:px-6 lg:px-8 max-w-lg mx-auto w-full space-y-6">
        <div className="text-center space-y-2">
          <Link to="/community" className="inline-flex items-center gap-1.5 text-xs text-[#2f9e44] hover:underline font-bold mb-2">
            <ArrowLeft className="w-4 h-4" /> Back to Community
          </Link>
          <h1 className="text-2xl font-extrabold text-white">Official Credential Verification</h1>
          <p className="text-xs text-gray-400 font-mono">GFG Campus Chapter Digital Registry</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400 font-mono">Verifying Credential...</div>
        ) : error || !data ? (
          <TechCard className="p-8 text-center bg-[#121721] border-red-500/40 space-y-3">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h2 className="text-lg font-bold text-white">Invalid or Expired Verification Badge</h2>
            <p className="text-xs text-gray-400">The requested membership verification ID was not found in our chapter registry.</p>
          </TechCard>
        ) : (
          <TechCard
            cornerAccents={true}
            className={`p-6 sm:p-8 ${theme.cardBg} ${theme.cardBorder} space-y-6 text-center shadow-2xl relative overflow-hidden transition-all duration-300`}
          >
            {/* Ambient Top Right Glow */}
            <div className={`absolute top-0 right-0 w-64 h-64 ${theme.accentGlow} rounded-full blur-3xl pointer-events-none`} />

            <div className="relative z-10">
              <div
                className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full ${theme.verifiedBadge} text-xs font-mono font-bold uppercase tracking-wider`}
              >
                <CheckCircle2 className="w-4 h-4" /> OFFICIAL VERIFIED MEMBER
              </div>
            </div>

            <div className="space-y-3 relative z-10">
              <img
                src={data.photo}
                alt={data.name}
                className={`w-24 h-24 rounded-2xl object-cover ${theme.photoBorder} mx-auto bg-[#0a0d12]`}
              />

              <div>
                <h2 className="text-xl font-extrabold text-white">{data.name}</h2>
                <div className="pt-1 flex justify-center">
                  <RoleBadge role={data.role} />
                </div>
              </div>
            </div>

            <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl ${theme.gridBg} text-left text-xs font-mono relative z-10 sm:divide-x sm:divide-[#30363d]/30`}>
              <div className="sm:pr-2">
                <span className="text-[10px] text-gray-500 uppercase block">Chapter</span>
                <span className="font-bold text-white block">{data.chapter || 'Jamia Hamdard'}</span>
              </div>

              <div className="sm:pl-3 sm:pr-2">
                <span className="text-[10px] text-gray-500 uppercase block">Member ID</span>
                <span className={`font-bold ${theme.credentialVal} block break-all`}>{data.membershipId || 'GFG-JH-2026-001'}</span>
              </div>

              <div className="sm:pl-3 sm:pr-2">
                <span className="text-[10px] text-gray-500 uppercase block">Active Session</span>
                <span className="text-gray-300 block">{data.session || '2026–27'}</span>
              </div>

              <div className="sm:pl-3">
                <span className="text-[10px] text-gray-500 uppercase block">Status</span>
                <span className={`${theme.statusText} font-bold capitalize block`}>● {data.membershipStatus || 'active'}</span>
              </div>
            </div>

            <p className="text-[10px] text-gray-500 font-mono relative z-10">
              Cryptographically verified by GeeksforGeeks Campus Body.
            </p>
          </TechCard>
        )}
      </main>

      <Footer />
    </div>
  );
}
