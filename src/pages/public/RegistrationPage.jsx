import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  Crown,
  ShieldCheck,
  Check,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  Loader2,
  Calendar,
  Lock,
  ChevronRight,
  User,
  Mail,
  Phone,
  Building2,
  Info,
  CheckCircle2,
  Search,
  FileText,
  HelpCircle,
  CheckCircle,
  Ticket
} from 'lucide-react';
import api from '../../services/api';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import CustomSelect from '../../components/registration/CustomSelect';
import MemberCard from '../../components/registration/MemberCard';
import RegistrationSuccessModal from '../../components/registration/RegistrationSuccessModal';

const STEPS = [
  { id: 1, title: 'Team Details', short: 'Team', icon: Users, desc: 'Basic info & track' },
  { id: 2, title: 'Faculty Mentor', short: 'Mentor', icon: GraduationCap, desc: 'Academic mentor' },
  { id: 3, title: 'Team Leader', short: 'Leader', icon: Crown, desc: 'Primary contact' },
  { id: 4, title: 'Team Members', short: 'Members', icon: ShieldCheck, desc: 'Dynamic members & review' }
];

const TEAM_SIZE_OPTIONS = [
  { value: '', label: 'Select team size', description: 'Choose total members including leader' },
  { value: '3', label: '3 Members', description: '1 Team Leader + 2 Additional Members' },
  { value: '4', label: '4 Members', description: '1 Team Leader + 3 Additional Members' },
  { value: '5', label: '5 Members', description: '1 Team Leader + 4 Additional Members' },
  { value: '6', label: '6 Members', description: '1 Team Leader + 5 Additional Members' }
];

const CATEGORY_OPTIONS = [
  { value: '', label: 'Select category', description: 'Choose your competition track' },
  { value: 'Technical Track', label: 'Technical Track', description: 'AI, Web3, Full-Stack, IoT, Cloud & Mobile Apps' },
  { value: 'Non-Technical Track', label: 'Non-Technical Track', description: 'UI/UX Design, Product Innovation & Tech Ideation' }
];

const DEPARTMENT_SUGGESTIONS = [
  'Computer Science & Engineering (CSE)',
  'Electronics & Communication Engineering (ECE)',
  'School of Engineering Sciences & Technology (SEST)',
  'Bachelor of Computer Applications (BCA)',
  'Master of Computer Applications (MCA)',
  'Information Technology (IT)',
  'Artificial Intelligence & Data Science (AI/DS)',
  'Diploma in Computer Engineering'
];

export default function RegistrationPage() {
  // Registration Status Control
  const isRegistrationClosed = true;

  // Page Title for SEO
  useEffect(() => {
    document.title = isRegistrationClosed
      ? 'THINKTANK Ideathon 2026 | Registration Closed | GFG Campus Body • Jamia Hamdard'
      : 'THINKTANK Ideathon 2026 Registration | GFG Campus Body • Jamia Hamdard';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [isRegistrationClosed]);

  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [confirmedRegistration, setConfirmedRegistration] = useState(null);

  // Registered Team Pass Lookup States (Supports ID or Email)
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState(null); // { title: string, message: string }
  const [lookupFieldError, setLookupFieldError] = useState(null);
  const [multipleTeams, setMultipleTeams] = useState(null);

  // Announcement Modal & Flash Banner States (Session-Based)
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showFlashBanner, setShowFlashBanner] = useState(false);

  useEffect(() => {
    const bannerDismissed = sessionStorage.getItem('ideathon_flash_banner_dismissed') === 'true';

    // When registration is closed, flash banner informs user gently without blocking popup
    if (!bannerDismissed) {
      setShowFlashBanner(true);
    }
  }, []);

  const handleCloseAnnouncementModal = () => {
    setShowAnnouncementModal(false);
    sessionStorage.setItem('ideathon_announcement_modal_dismissed', 'true');
    const bannerDismissed = sessionStorage.getItem('ideathon_flash_banner_dismissed') === 'true';
    if (!bannerDismissed) {
      setShowFlashBanner(true);
    }
  };

  const handleModalRegisterCTA = () => {
    setShowAnnouncementModal(false);
    sessionStorage.setItem('ideathon_announcement_modal_dismissed', 'true');
    scrollToOverviewOrForm();
  };

  const handleModalExploreDetails = () => {
    setShowAnnouncementModal(false);
    sessionStorage.setItem('ideathon_announcement_modal_dismissed', 'true');
    scrollToEventOverview();
  };

  const handleDismissFlashBanner = () => {
    setShowFlashBanner(false);
    sessionStorage.setItem('ideathon_flash_banner_dismissed', 'true');
  };

  const scrollToOverviewOrForm = () => {
    const targetId = isRegistrationClosed ? 'registration-closed-section' : 'registration-form-section';
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 380, behavior: 'smooth' });
    }
  };

  // Lookup existing team registration pass using Registration ID or Team Leader Email
  const handleLookupRegistration = async (e) => {
    e?.preventDefault();
    const query = lookupQuery.trim();

    // Validation — Required Field
    if (!query) {
      setLookupFieldError('Please enter your Registration ID or Leader Email.');
      setLookupError({
        title: 'Please Complete All Required Fields',
        message: 'Enter your Registration ID or team leader email to continue.'
      });
      return;
    }

    const isEmail = query.includes('@');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (isEmail && !emailRegex.test(query)) {
      setLookupFieldError('Please enter a valid email address.');
      setLookupError({
        title: 'Please Complete All Required Fields',
        message: 'Please enter a valid team leader email address to continue.'
      });
      return;
    }

    setLookupLoading(true);
    setLookupError(null);
    setLookupFieldError(null);
    setMultipleTeams(null);

    try {
      // Send either leaderEmail or registrationId based on input detection
      const payload = isEmail
        ? { leaderEmail: query.toLowerCase() }
        : { registrationId: query.toUpperCase() };

      const res = await api.post('/registration/retrieve-pass', payload);

      if (res.data?.success) {
        if (res.data.multiple && Array.isArray(res.data.data) && res.data.data.length > 1) {
          // Multiple teams found for this leader email
          setMultipleTeams(res.data.data);
          const el = document.getElementById('team-selection-section');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        } else if (res.data.data) {
          // Single team pass found
          const teamRecord = Array.isArray(res.data.data) ? res.data.data[0] : res.data.data;
          setConfirmedRegistration(teamRecord);
          window.scrollTo({ top: 80, behavior: 'smooth' });
        } else {
          setLookupError({
            title: 'Unable to Verify Registration',
            message: "We couldn't verify your registration with the details provided. Check your Registration Pass ID or registered email address, then try again."
          });
        }
      }
    } catch (err) {
      const status = err.response?.status;
      if (status === 400 || status === 404) {
        setLookupError({
          title: err.response?.data?.title || 'Unable to Verify Registration',
          message: err.response?.data?.message || "We couldn't verify your registration with the details provided. Check your Registration Pass ID or registered email address, then try again."
        });
      } else if (status === 429) {
        setLookupError({
          title: 'Too Many Attempts',
          message: err.response?.data?.message || 'Too many retrieval attempts from this network. Please wait a few minutes before trying again.'
        });
      } else {
        // 5xx / Network Error: preserve entered values and allow retry
        setLookupError({
          title: 'Something Went Wrong',
          message: "We couldn't verify your registration right now. Please check your internet connection and try again."
        });
      }
    } finally {
      setLookupLoading(false);
    }
  };

  const scrollToEventOverview = () => {
    const el = document.getElementById('event-overview-header');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Form State
  const [formData, setFormData] = useState({
    teamName: '',
    teamSize: '',
    category: '',
    facultyMentor: '',
    leader: {
      name: '',
      email: '',
      mobile: '',
      department: ''
    },
    members: []
  });

  // Validation Errors Map
  const [errors, setErrors] = useState({});

  // Sync Dynamic Members Array whenever Team Size changes
  useEffect(() => {
    const size = parseInt(formData.teamSize, 10);
    if (!size || isNaN(size)) {
      return;
    }
    const neededMembers = size - 1; // Team leader is included in total
    setFormData((prev) => {
      const currentMembers = [...prev.members];
      if (currentMembers.length === neededMembers) {
        return prev;
      }
      if (currentMembers.length < neededMembers) {
        // Add additional blank member slots
        const additional = Array.from(
          { length: neededMembers - currentMembers.length },
          () => ({
            name: '',
            email: '',
            mobile: '',
            department: ''
          })
        );
        return {
          ...prev,
          members: [...currentMembers, ...additional]
        };
      }
      // If team size was reduced, trim excess members
      return {
        ...prev,
        members: currentMembers.slice(0, neededMembers)
      };
    });
  }, [formData.teamSize]);

  // Handle Leader field changes
  const handleLeaderChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      leader: {
        ...prev.leader,
        [field]: value
      }
    }));
    // Clear inline error on change
    if (errors[`leader_${field}`]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[`leader_${field}`];
        return next;
      });
    }
  };

  // Handle Dynamic Member field changes
  const handleMemberChange = (memberIndex, field, value) => {
    const arrayIndex = memberIndex - 2; // Member 2 is index 0
    setFormData((prev) => {
      const newMembers = [...prev.members];
      if (!newMembers[arrayIndex]) {
        newMembers[arrayIndex] = { name: '', email: '', mobile: '', department: '' };
      }
      newMembers[arrayIndex] = {
        ...newMembers[arrayIndex],
        [field]: value
      };
      return {
        ...prev,
        members: newMembers
      };
    });

    const errorKey = `member_${memberIndex}_${field}`;
    if (errors[errorKey]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[errorKey];
        return next;
      });
    }
  };

  // Field validation helpers
  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
  };

  const isValidPhone = (phone) => {
    const cleaned = String(phone).replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 13;
  };

  // Step Validation logic
  const validateStep = (stepNumber) => {
    const newErrors = {};

    if (stepNumber === 1) {
      if (!formData.teamName.trim()) {
        newErrors.teamName = 'Team Name is required.';
      } else if (formData.teamName.trim().length < 2) {
        newErrors.teamName = 'Team Name must be at least 2 characters long.';
      }

      if (!formData.teamSize) {
        newErrors.teamSize = 'Please select the total number of team members.';
      }

      if (!formData.category) {
        newErrors.category = 'Please select a competition track category.';
      }
    }

    if (stepNumber === 2) {
      if (!formData.facultyMentor.trim()) {
        newErrors.facultyMentor = 'Faculty Mentor Name is required.';
      } else if (formData.facultyMentor.trim().length < 2) {
        newErrors.facultyMentor = 'Please enter a valid faculty mentor name.';
      }
    }

    if (stepNumber === 3) {
      if (!formData.leader.name.trim()) {
        newErrors.leader_name = 'Leader Name is required.';
      }
      if (!formData.leader.email.trim()) {
        newErrors.leader_email = 'Leader Email is required.';
      } else if (!isValidEmail(formData.leader.email)) {
        newErrors.leader_email = 'Please enter a valid email address.';
      }
      if (!formData.leader.mobile.trim()) {
        newErrors.leader_mobile = 'Leader Mobile Number is required.';
      } else if (!isValidPhone(formData.leader.mobile)) {
        newErrors.leader_mobile = 'Enter a valid 10-digit mobile number.';
      }
      if (!formData.leader.department.trim()) {
        newErrors.leader_department = 'Department / Course is required.';
      }
    }

    if (stepNumber === 4) {
      const size = parseInt(formData.teamSize, 10);
      const neededMembers = (size || 3) - 1;
      const cleanLeaderEmail = formData.leader.email?.trim().toLowerCase();
      const seenEmails = new Map();
      if (cleanLeaderEmail) {
        seenEmails.set(cleanLeaderEmail, 'Team Leader');
      }

      for (let i = 0; i < neededMembers; i++) {
        const memberNum = i + 2;
        const member = formData.members[i] || {};
        const memEmail = member.email?.trim().toLowerCase();

        if (!member.name?.trim()) {
          newErrors[`member_${memberNum}_name`] = `Member ${memberNum} Name is required.`;
        }
        if (!member.email?.trim()) {
          newErrors[`member_${memberNum}_email`] = `Member ${memberNum} Email is required.`;
        } else if (!isValidEmail(member.email)) {
          newErrors[`member_${memberNum}_email`] = `Valid email is required.`;
        } else if (memEmail && seenEmails.has(memEmail)) {
          newErrors[`member_${memberNum}_email`] = `Must be unique. Already entered for ${seenEmails.get(memEmail)}.`;
        } else if (memEmail) {
          seenEmails.set(memEmail, `Member ${memberNum}`);
        }

        if (!member.mobile?.trim()) {
          newErrors[`member_${memberNum}_mobile`] = `Mobile number is required.`;
        } else if (!isValidPhone(member.mobile)) {
          newErrors[`member_${memberNum}_mobile`] = `Valid 10-digit number required.`;
        }
        if (!member.department?.trim()) {
          newErrors[`member_${memberNum}_department`] = `Department is required.`;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step Navigation
  const handleContinue = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  // Prevent premature form submit on Enter key inside inputs
  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // On intermediate steps, trigger continue
      if (currentStep < 4) {
        handleContinue();
      }
    }
  };

  // Final Submission Handler (Strict Confirmation - Never False Success)
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (submitting) return; // Prevent double submission
    setSubmitError(null);

    // Validate all 4 steps
    const step1Valid = validateStep(1);
    const step2Valid = validateStep(2);
    const step3Valid = validateStep(3);
    const step4Valid = validateStep(4);

    if (!step1Valid) {
      setCurrentStep(1);
      setSubmitError('Please complete all required fields in Step 1 (Team Name, Size, and Category Track).');
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }
    if (!step2Valid) {
      setCurrentStep(2);
      setSubmitError('Please provide the Faculty Mentor name in Step 2.');
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }
    if (!step3Valid) {
      setCurrentStep(3);
      setSubmitError('Please fill in all Team Leader details (Name, Email, 10-digit Mobile, Department).');
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }
    if (!step4Valid) {
      setCurrentStep(4);
      setSubmitError('Please correct member details (Each member must have a unique email address, valid 10-digit mobile, and department).');
      window.scrollTo({ top: 220, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        eventName: 'THINKTANK IDEATHON 2026',
        teamName: formData.teamName.trim(),
        teamSize: parseInt(formData.teamSize, 10),
        category: formData.category,
        facultyMentor: formData.facultyMentor.trim(),
        leader: {
          name: formData.leader.name.trim(),
          email: formData.leader.email.trim(),
          mobile: formData.leader.mobile.trim(),
          department: formData.leader.department.trim()
        },
        members: formData.members.slice(0, parseInt(formData.teamSize, 10) - 1).map((m, idx) => ({
          memberIndex: idx + 2,
          name: m.name.trim(),
          email: m.email.trim(),
          mobile: m.mobile.trim(),
          department: m.department.trim()
        }))
      };

      // Submit to Backend API (which synchronously confirms persistence in Google Sheets & MongoDB)
      const res = await api.post('/registration', payload);

      if (res.data?.success && res.data?.data && res.data?.data?.registrationId) {
        // Confirmed persistence verified
        setConfirmedRegistration(res.data.data);
        window.scrollTo({ top: 80, behavior: 'smooth' });
      } else {
        throw new Error(res.data?.message || 'Server did not return a confirmed Registration ID. Please try again.');
      }
    } catch (err) {
      console.error('Registration submission error:', err);

      // If 409 duplicate team name, jump to Step 1 and notify user clearly
      if (err.response?.status === 409) {
        setCurrentStep(1);
        setSubmitError(err.response.data?.message || `A team named "${formData.teamName.trim()}" is already registered. Please choose a different team name.`);
        window.scrollTo({ top: 120, behavior: 'smooth' });
        return;
      }

      // If 400 validation error (e.g., duplicate email)
      if (err.response?.status === 400 || err.response?.status === 422) {
        const msg = err.response.data?.message || 'Validation failed. Please verify your team details.';
        if (msg.toLowerCase().includes('unique email') || msg.toLowerCase().includes('member')) {
          setCurrentStep(4);
        }
        setSubmitError(msg);
        window.scrollTo({ top: 120, behavior: 'smooth' });
        return;
      }

      const serverMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (err.code === 'ECONNABORTED' || err.message?.includes('timeout')
          ? 'Registration request timed out while communicating with official records. Please check your network and retry. Your entered data has been preserved.'
          : err.code === 'ERR_NETWORK'
            ? 'Unable to connect to registration server. Please check your internet connection and try again. Your entered data has been preserved.'
            : 'An unexpected error occurred during submission. Your entered data has been preserved. Please try again.');
      setSubmitError(serverMessage);
      window.scrollTo({ top: 120, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setConfirmedRegistration(null);
    setCurrentStep(1);
    setErrors({});
    setSubmitError(null);
    setLookupQuery('');
    setLookupLoading(false);
    setLookupError(null);
    setLookupFieldError(null);
    setMultipleTeams(null);
    setFormData({
      teamName: '',
      teamSize: '',
      category: '',
      facultyMentor: '',
      leader: {
        name: '',
        email: '',
        mobile: '',
        department: ''
      },
      members: []
    });
  };

  const totalMembersNum = parseInt(formData.teamSize, 10);
  const additionalMembersCount = totalMembersNum ? Math.max(0, totalMembersNum - 1) : 0;

  return (
    <div className="min-h-screen bg-[#0B100E] text-[#F5F7F5] flex flex-col relative selection:bg-[#22A447]/30 selection:text-white w-full max-w-full overflow-x-clip">
      {/* Universal Website Navbar */}
      <div className="print:hidden">
        <Navbar />
      </div>

      {/* Subtle Ambient Lighting - strictly clipped to screen width to prevent mobile scaling issues */}
      <div className="absolute top-0 left-0 right-0 h-[360px] overflow-hidden pointer-events-none z-0 print:hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] max-w-[100vw] h-[320px] bg-gradient-to-b from-[#22A447]/5 via-transparent to-transparent blur-3xl"></div>
      </div>

      <main className="flex-1 relative z-10 max-w-4xl mx-auto w-full px-3.5 sm:px-6 py-6 sm:py-12 min-w-0">
        {confirmedRegistration ? (
          /* Success Pass & Confirmation Screen */
          <RegistrationSuccessModal
            registration={confirmedRegistration}
            onReset={handleResetForm}
          />
        ) : (
          <div className="space-y-5 sm:space-y-8 w-full min-w-0">
            {/* ─── 1. EVENT INTRODUCTION HEADER ───────────────────────── */}
            <header id="event-overview-header" className="rounded-2xl bg-[#121916] border border-[#28342D] p-4 sm:p-8 space-y-5 sm:space-y-6 shadow-xl scroll-mt-24 w-full min-w-0">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 sm:gap-6">
                <div className="space-y-3 min-w-0 flex-1">
                  {/* Institutional & Lab Eyebrow */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#A2ADA6]">
                    <span className="font-semibold text-[#22A447]">GeeksforGeeks Campus Body</span>
                    <span>•</span>
                    <span>Jamia Hamdard</span>
                    <span>•</span>
                    <span className="px-2 py-0.5 rounded bg-[#171F1B] border border-[#28342D] text-[#A2ADA6] text-[11px] font-medium">
                      Under 5G Use Case Lab
                    </span>
                    {isRegistrationClosed && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                        Registration Closed
                      </span>
                    )}
                  </div>

                  {/* Primary Heading */}
                  <h1 className="text-2xl sm:text-4xl font-extrabold text-[#F5F7F5] tracking-tight">
                    THINKTANK IDEATHON 2026
                  </h1>

                  {/* Supporting Heading */}
                  <p className="text-base sm:text-lg font-medium text-[#A2ADA6]">
                    Ideas into <span className="text-[#22A447]">innovation</span>. Solutions for the future.
                  </p>

                  {/* Supporting Description */}
                  <p className="text-sm text-[#A2ADA6] leading-relaxed max-w-2xl">
                    A student innovation platform where teams develop practical solutions and explore real-world applications under the 5G Use Case Lab.
                  </p>
                </div>

                {/* Official Logos Lockup */}
                <div className="flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3.5 rounded-2xl bg-[#171F1B] border border-[#28342D] self-start flex-shrink-0 shadow-md">
                  <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl bg-white p-1.5 sm:p-2.5 flex items-center justify-center shadow-sm flex-shrink-0">
                    <img
                      src="/assets/gfg-official-logo.png"
                      alt="GeeksforGeeks Campus Body"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="w-px h-10 sm:h-14 bg-[#28342D]"></div>
                  <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl bg-white p-1.5 sm:p-2.5 flex items-center justify-center shadow-sm flex-shrink-0">
                    <img
                      src="/assets/jamia-logo.png"
                      alt="Jamia Hamdard Crest"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              </div>

              {/* Clean Metadata Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 border-t border-[#28342D] text-xs">
                <div>
                  <span className="text-[#707E75] block">Tracks</span>
                  <span className="font-semibold text-[#F5F7F5] mt-0.5 block">Tech & Non-Tech</span>
                </div>
                <div>
                  <span className="text-[#707E75] block">Team Size</span>
                  <span className="font-semibold text-[#F5F7F5] mt-0.5 block">3 to 6 Members</span>
                </div>
                <div>
                  <span className="text-[#707E75] block">Mentorship</span>
                  <span className="font-semibold text-[#F5F7F5] mt-0.5 block">Faculty Guided</span>
                </div>
                <div>
                  <span className="text-[#707E75] block">Total Prize Pool</span>
                  <span className="font-semibold text-[#22A447] mt-0.5 block">₹9,000 Prizes 🏆</span>
                </div>
              </div>
            </header>

            {/* ─── COMPACT REGISTRATION PASS RETRIEVAL CARD / TEAM SELECTION ─── */}
            {multipleTeams && multipleTeams.length > 1 ? (
              /* Multiple Teams Selection Screen */
              <div id="team-selection-section" className="rounded-2xl bg-[#121916] border border-[#28342D] p-4 sm:p-6 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#28342D] pb-3.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#22A447]/15 border border-[#22A447]/30 text-[#22A447] text-xs font-mono font-bold uppercase tracking-wider">
                        {multipleTeams.length} Teams Registered
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-extrabold text-[#F5F7F5] mt-1 tracking-tight">
                      Select Your Team Pass
                    </h3>
                    <p className="text-xs sm:text-sm text-[#A2ADA6] mt-0.5">
                      Multiple team entries were found for this email. Choose a team to view, print, or download its official confirmation pass:
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMultipleTeams(null)}
                    className="self-start sm:self-center px-3.5 py-1.5 rounded-lg bg-[#171F1B] hover:bg-[#28342D] border border-[#28342D] text-xs text-[#A2ADA6] hover:text-white transition-colors cursor-pointer"
                  >
                    ← Search Again
                  </button>
                </div>

                <div className="space-y-2.5">
                  {multipleTeams.map((team) => (
                    <button
                      key={team.registrationId || team._id}
                      type="button"
                      onClick={() => {
                        setConfirmedRegistration(team);
                        setMultipleTeams(null);
                        window.scrollTo({ top: 80, behavior: 'smooth' });
                      }}
                      className="w-full text-left p-3.5 sm:p-4 rounded-xl bg-[#171F1B] hover:bg-[#1E2924] border border-[#28342D] hover:border-[#22A447]/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group cursor-pointer shadow-sm"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm sm:text-base text-[#F5F7F5] group-hover:text-[#22A447] transition-colors truncate">
                            {team.teamName}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-[#121916] border border-[#28342D] font-mono text-xs font-bold text-[#22A447]">
                            {team.registrationId}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-[#707E75]">
                          <span>Track: <strong className="text-[#A2ADA6]">{team.category}</strong></span>
                          <span>•</span>
                          <span>Size: <strong className="text-[#A2ADA6]">{team.teamSize} Members</strong></span>
                          {team.facultyMentor && (
                            <>
                              <span>•</span>
                              <span>Mentor: <strong className="text-[#A2ADA6]">{team.facultyMentor}</strong></span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-bold text-[#22A447] group-hover:translate-x-1 transition-transform self-end sm:self-center flex-shrink-0">
                        <span>View Pass</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Compact Pass Retrieval Card */
              <div className="rounded-2xl bg-[#121916] border border-[#28342D] hover:border-[#22A447]/40 p-4 sm:p-6 shadow-xl relative overflow-hidden transition-all">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#22A447]/5 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#22A447]/15 border border-[#22A447]/30 flex items-center justify-center text-[#22A447] flex-shrink-0 mt-0.5">
                    <Ticket className="w-5 h-5 text-[#22A447]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base sm:text-lg font-bold text-[#F5F7F5] tracking-tight">
                        Already Registered?
                      </h2>
                      <span className="text-xs sm:text-sm font-semibold text-[#22A447]">
                        Retrieve your confirmation pass
                      </span>
                    </div>
                    <p className="text-xs text-[#A2ADA6] mt-0.5 leading-relaxed">
                      Enter your Registration Pass ID or team leader email to access your official pass.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleLookupRegistration} className="mt-4 space-y-3">
                  <div className="space-y-1.5">
                    <label htmlFor="pass-lookup-input" className="block text-xs font-semibold text-[#A2ADA6]">
                      Registration ID or Leader Email
                    </label>
                    <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                      <div className="relative flex-1 min-w-0">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#707E75]">
                          <Search className="w-4 h-4" />
                        </div>
                        <input
                          id="pass-lookup-input"
                          type="text"
                          value={lookupQuery}
                          onChange={(e) => {
                            setLookupQuery(e.target.value);
                            if (lookupError) setLookupError(null);
                            if (lookupFieldError) setLookupFieldError(null);
                          }}
                          placeholder="Enter registration ID or email address"
                          className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#171F1B] border ${
                            lookupFieldError ? 'border-rose-500/70 focus:border-rose-500' : 'border-[#28342D] focus:border-[#22A447]'
                          } text-xs sm:text-sm text-[#F5F7F5] placeholder-[#5C6A62] focus:outline-none focus:ring-1 ${
                            lookupFieldError ? 'focus:ring-rose-500' : 'focus:ring-[#22A447]'
                          } font-mono tracking-wide transition-colors`}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={lookupLoading}
                        className="py-2.5 px-6 rounded-xl bg-[#22A447] hover:bg-[#1e913e] disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all flex-shrink-0 cursor-pointer active:scale-95"
                      >
                        {lookupLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Verifying your registration…</span>
                          </>
                        ) : (
                          <>
                            <span>Retrieve My Pass</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                    {lookupFieldError && (
                      <p className="text-[11px] text-rose-400 pl-1 font-medium">
                        {lookupFieldError}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-[#707E75] pt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#22A447] flex-shrink-0" />
                    <span>Secure verification of your registration</span>
                  </div>

                  {lookupError && (
                    <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-300 text-xs space-y-1">
                      <div className="flex items-center gap-2 font-bold text-rose-200 text-xs sm:text-sm">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                        <span>{lookupError.title}</span>
                      </div>
                      <p className="text-xs text-rose-300/90 pl-6 leading-relaxed">
                        {lookupError.message}
                      </p>
                    </div>
                  )}
                </form>
              </div>
            )}

            {isRegistrationClosed ? (
              /* ─── REGISTRATION CLOSED INTERFACE & PASS RETRIEVAL ─────────── */
              <div id="registration-closed-section" className="space-y-6 sm:space-y-8 w-full min-w-0">
                {/* 1. Official Closed Notice Card */}
                <div className="rounded-2xl bg-[#121916] border border-amber-500/30 p-5 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

                  <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0 shadow-inner">
                      <Lock className="w-6 h-6 text-amber-400" />
                    </div>
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider">
                          Official Notice
                        </span>
                        <span className="text-xs text-[#707E75]">•</span>
                        <span className="text-xs text-[#A2ADA6]">THINKTANK IDEATHON 2026</span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-extrabold text-[#F5F7F5] tracking-tight">
                        Online Registrations Are Officially Closed
                      </h2>
                      <p className="text-sm text-[#A2ADA6] leading-relaxed">
                        The registration portal for <strong className="text-white font-semibold">THINKTANK IDEATHON 2026</strong> under the 5G Use Case Lab has concluded. Thank you to all the student teams from Jamia Hamdard and participating institutions for your overwhelming interest and innovative submissions!
                      </p>
                    </div>
                  </div>

                  {/* 3 Step Timeline of Event Stages */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[#28342D]">
                    <div className="p-3.5 rounded-xl bg-[#171F1B] border border-[#28342D] space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#707E75] font-mono">Stage 01</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#28342D] text-[#A2ADA6] font-semibold">
                          Concluded
                        </span>
                      </div>
                      <div className="text-sm font-bold text-[#F5F7F5]">Team Registration</div>
                      <p className="text-[11px] text-[#A2ADA6] leading-normal">
                        Team submissions & faculty mentor assignments.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#171F1B] border border-amber-500/40 space-y-1 shadow-sm">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-amber-400 font-mono">Stage 02</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold animate-pulse">
                          In Progress
                        </span>
                      </div>
                      <div className="text-sm font-bold text-white">Idea Shortlisting</div>
                      <p className="text-[11px] text-[#A2ADA6] leading-normal">
                        Faculty review & technical evaluation of 5G use cases.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#171F1B] border border-[#28342D] space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#707E75] font-mono">Stage 03</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#28342D] text-[#A2ADA6] font-semibold">
                          Upcoming
                        </span>
                      </div>
                      <div className="text-sm font-bold text-[#F5F7F5]">Offline Presentation</div>
                      <p className="text-[11px] text-[#A2ADA6] leading-normal">
                        Final prototype & idea pitch at 5G Use Case Lab.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Event Help & Community Callouts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-[#121916] border border-[#28342D] space-y-3">
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                      <HelpCircle className="w-4 h-4 text-[#22A447]" />
                      <span>Questions or Updates?</span>
                    </div>
                    <p className="text-xs text-[#A2ADA6] leading-relaxed">
                      If you need to make corrections to your registered team or faculty mentor details, please reach out to the campus body coordinators.
                    </p>
                    <div className="pt-1">
                      <a
                        href="mailto:gfgstudentbody.jh@gmail.com"
                        className="inline-flex items-center gap-2 text-xs font-semibold text-[#22A447] hover:underline"
                      >
                        <Mail className="w-3.5 h-3.5 flex-shrink-0 text-[#22A447]" />
                        <span>gfgstudentbody.jh@gmail.com</span>
                      </a>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#121916] border border-[#28342D] space-y-3 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-white font-bold text-sm">
                        <Sparkles className="w-4 h-4 text-[#22A447]" />
                        <span>Discover More Opportunities</span>
                      </div>
                      <p className="text-xs text-[#A2ADA6] leading-relaxed">
                        Stay active with upcoming coding contests, workshops, and tech communities on campus.
                      </p>
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                      <Link
                        to="/events"
                        className="px-4 py-2 rounded-lg bg-[#171F1B] hover:bg-[#28342D] border border-[#28342D] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <span>All Events</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <Link
                        to="/community"
                        className="px-4 py-2 rounded-lg bg-[#171F1B] hover:bg-[#28342D] border border-[#28342D] text-[#A2ADA6] hover:text-white text-xs font-medium transition-colors"
                      >
                        Community Feed
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* ─── 2. PROGRESS STEPPER ────────────────────────────────── */}
                {/* Desktop Stepper */}
            <nav aria-label="Registration Progress" className="hidden sm:block rounded-xl bg-[#121916] border border-[#28342D] p-2.5 shadow-sm">
              <div className="grid grid-cols-4 gap-2">
                {STEPS.map((step) => {
                  const isCompleted = currentStep > step.id;
                  const isActive = currentStep === step.id;

                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => {
                        if (step.id < currentStep) setCurrentStep(step.id);
                      }}
                      disabled={step.id > currentStep}
                      className={`flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors ${
                        isActive
                          ? 'bg-[#171F1B] text-[#F5F7F5]'
                          : isCompleted
                          ? 'text-[#F5F7F5] hover:bg-[#171F1B]/60 cursor-pointer'
                          : 'text-[#707E75] cursor-not-allowed'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-semibold flex-shrink-0 transition-colors ${
                          isActive
                            ? 'bg-[#22A447] text-white'
                            : isCompleted
                            ? 'bg-[#22A447]/20 text-[#22A447]'
                            : 'bg-[#171F1B] border border-[#28342D] text-[#707E75]'
                        }`}
                      >
                        {isCompleted ? <Check className="w-3.5 h-3.5 text-[#22A447]" /> : step.id}
                      </div>
                      <div className="min-w-0">
                        <span className="block text-xs font-semibold truncate leading-tight">
                          {step.title}
                        </span>
                        <span className="block text-[11px] text-[#707E75] truncate mt-0.5">
                          {step.desc}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </nav>

            {/* Mobile Stepper */}
            <div className="sm:hidden rounded-xl bg-[#121916] border border-[#28342D] p-3.5 sm:p-4 space-y-2.5 shadow-sm w-full min-w-0">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[#A2ADA6]">
                  Step {currentStep} of 4: <strong className="text-[#F5F7F5]">{STEPS[currentStep - 1]?.title}</strong>
                </span>
                <span className="text-[11px] text-[#22A447] font-semibold">
                  {Math.round((currentStep / 4) * 100)}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#171F1B] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#22A447] transition-all duration-300"
                  style={{ width: `${(currentStep / 4) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Error Notification Banner */}
            {submitError && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/40 text-rose-300 text-xs sm:text-sm flex items-start gap-3 shadow-md w-full min-w-0"
              >
                <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5 min-w-0 flex-1">
                  <p className="font-semibold text-white">Notice</p>
                  <p className="text-rose-200/90 leading-relaxed break-words">{submitError}</p>
                </div>
              </motion.div>
            )}

            {/* ─── 3. PRIMARY FORM SURFACE ───────────────────────────── */}
            <div
              id="registration-form-section"
              className="rounded-2xl bg-[#121916] border border-[#28342D] p-4 sm:p-10 shadow-xl relative scroll-mt-28 w-full min-w-0"
            >
              <AnimatePresence mode="wait">
                {/* ─── STEP 01: TEAM DETAILS ─────────────────────────────── */}
                {currentStep === 1 && (
                  <motion.div
                    key="step-1"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-6"
                  >
                    {/* Step Heading */}
                    <div className="border-b border-[#28342D] pb-4">
                      <span className="text-[11px] text-[#22A447] font-semibold uppercase tracking-wider block">
                        Step 1 of 4
                      </span>
                      <h2 className="text-xl sm:text-2xl font-bold text-[#F5F7F5] mt-1">
                        Team Details
                      </h2>
                      <p className="text-xs sm:text-sm text-[#A2ADA6] mt-0.5">
                        Start with your team identity and competition category.
                      </p>
                    </div>

                    {/* Step 1 Fields */}
                    <div className="space-y-5">
                      {/* Team Name */}
                      <div className="space-y-1.5">
                        <label
                          htmlFor="teamName"
                          className="block text-xs font-medium text-[#A2ADA6]"
                        >
                          Team Name <span className="text-[#22A447] font-semibold">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#707E75]">
                            <Users className="w-4 h-4" />
                          </div>
                          <input
                            type="text"
                            id="teamName"
                            value={formData.teamName}
                            onChange={(e) => {
                              setFormData({ ...formData, teamName: e.target.value });
                              if (errors.teamName) setErrors({ ...errors, teamName: null });
                            }}
                            onKeyDown={handleInputKeyDown}
                            placeholder="e.g. CyberKnights Hamdard"
                            className={`w-full pl-9 pr-3.5 py-2.5 rounded-lg bg-[#171F1B] border text-sm text-[#F5F7F5] placeholder-[#5C6A62] focus:outline-none transition-all ${
                              errors.teamName
                                ? 'border-rose-500/80 bg-rose-950/20 focus:ring-1 focus:ring-rose-500/50'
                                : 'border-[#28342D] hover:border-[#3A4B41] focus:border-[#22A447] focus:ring-1 focus:ring-[#22A447]'
                            }`}
                          />
                        </div>
                        {errors.teamName && (
                          <p className="text-[11px] text-rose-400 font-medium">{errors.teamName}</p>
                        )}
                      </div>

                      {/* Team Size */}
                      <CustomSelect
                        id="teamSize"
                        label="Number of Members"
                        required
                        value={formData.teamSize}
                        onChange={(val) => {
                          setFormData({ ...formData, teamSize: val });
                          if (errors.teamSize) setErrors({ ...errors, teamSize: null });
                        }}
                        options={TEAM_SIZE_OPTIONS}
                        placeholder="Select team size"
                        helperText="The team leader is included in the selected total."
                        error={errors.teamSize}
                      />

                      {/* Informational Callout */}
                      {formData.teamSize && (
                        <div className="p-3 rounded-lg bg-[#171F1B] border border-[#28342D] flex items-center gap-3 text-xs text-[#A2ADA6]">
                          <Info className="w-4 h-4 text-[#22A447] flex-shrink-0" />
                          <div>
                            <span className="font-semibold text-[#F5F7F5]">Selected team size: {formData.teamSize} Members</span>
                            <span className="block text-[11px] text-[#707E75] mt-0.5">
                              (1 Team Leader + {parseInt(formData.teamSize, 10) - 1} Additional Members)
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Category Track */}
                      <CustomSelect
                        id="category"
                        label="Competition Track"
                        required
                        value={formData.category}
                        onChange={(val) => {
                          setFormData({ ...formData, category: val });
                          if (errors.category) setErrors({ ...errors, category: null });
                        }}
                        options={CATEGORY_OPTIONS}
                        placeholder="Select category track"
                        helperText="Choose between Technical Track or Non-Technical Track."
                        error={errors.category}
                      />
                    </div>

                    {/* Step 1 Actions */}
                    <div className="pt-4 border-t border-[#28342D] flex justify-end">
                      <button
                        type="button"
                        onClick={handleContinue}
                        className="px-6 py-2.5 rounded-lg bg-[#22A447] hover:bg-[#1E943F] active:bg-[#1A8237] text-white text-sm font-semibold flex items-center gap-2 transition-all shadow-sm"
                      >
                        <span>Continue</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* ─── STEP 02: FACULTY MENTOR ──────────────────────────── */}
                {currentStep === 2 && (
                  <motion.div
                    key="step-2"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-6"
                  >
                    {/* Step Heading */}
                    <div className="border-b border-[#28342D] pb-4">
                      <span className="text-[11px] text-[#22A447] font-semibold uppercase tracking-wider block">
                        Step 2 of 4
                      </span>
                      <h2 className="text-xl sm:text-2xl font-bold text-[#F5F7F5] mt-1">
                        Faculty Mentor
                      </h2>
                      <p className="text-xs sm:text-sm text-[#A2ADA6] mt-0.5">
                        Provide the name of your academic coordinator or faculty guide.
                      </p>
                    </div>

                    {/* Step 2 Fields */}
                    <div className="space-y-5">
                      <div className="space-y-1.5">
                        <label
                          htmlFor="facultyMentor"
                          className="block text-xs font-medium text-[#A2ADA6]"
                        >
                          Faculty Mentor Full Name <span className="text-[#22A447] font-semibold">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#707E75]">
                            <GraduationCap className="w-4 h-4" />
                          </div>
                          <input
                            type="text"
                            id="facultyMentor"
                            value={formData.facultyMentor}
                            onChange={(e) => {
                              setFormData({ ...formData, facultyMentor: e.target.value });
                              if (errors.facultyMentor) setErrors({ ...errors, facultyMentor: null });
                            }}
                            onKeyDown={handleInputKeyDown}
                            placeholder="e.g. Dr. Sherin Zafar / Dr. Ayesha Khan"
                            className={`w-full pl-9 pr-3.5 py-2.5 rounded-lg bg-[#171F1B] border text-sm text-[#F5F7F5] placeholder-[#5C6A62] focus:outline-none transition-all ${
                              errors.facultyMentor
                                ? 'border-rose-500/80 bg-rose-950/20 focus:ring-1 focus:ring-rose-500/50'
                                : 'border-[#28342D] hover:border-[#3A4B41] focus:border-[#22A447] focus:ring-1 focus:ring-[#22A447]'
                            }`}
                          />
                        </div>
                        {errors.facultyMentor && (
                          <p className="text-[11px] text-rose-400 font-medium">{errors.facultyMentor}</p>
                        )}
                        <p className="text-[11px] text-[#707E75] mt-1">
                          Teams are encouraged to coordinate with a departmental professor or academic advisor.
                        </p>
                      </div>
                    </div>

                    {/* Step 2 Actions */}
                    <div className="pt-4 border-t border-[#28342D] flex items-center justify-between">
                      <button
                        type="button"
                        onClick={handleBack}
                        className="px-4 py-2.5 rounded-lg bg-[#171F1B] hover:bg-[#1E2924] border border-[#28342D] text-xs sm:text-sm font-medium text-[#A2ADA6] hover:text-[#F5F7F5] flex items-center gap-1.5 transition-all"
                      >
                        <ArrowLeft className="w-4 h-4" /> Previous
                      </button>
                      <button
                        type="button"
                        onClick={handleContinue}
                        className="px-6 py-2.5 rounded-lg bg-[#22A447] hover:bg-[#1E943F] active:bg-[#1A8237] text-white text-sm font-semibold flex items-center gap-2 transition-all shadow-sm"
                      >
                        <span>Continue</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* ─── STEP 03: TEAM LEADER ─────────────────────────────── */}
                {currentStep === 3 && (
                  <motion.div
                    key="step-3"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-6"
                  >
                    {/* Step Heading */}
                    <div className="border-b border-[#28342D] pb-4">
                      <span className="text-[11px] text-[#22A447] font-semibold uppercase tracking-wider block">
                        Step 3 of 4
                      </span>
                      <h2 className="text-xl sm:text-2xl font-bold text-[#F5F7F5] mt-1">
                        Team Leader
                      </h2>
                      <p className="text-xs sm:text-sm text-[#A2ADA6] mt-0.5">
                        Primary student coordinator and point of contact for the team.
                      </p>
                    </div>

                    {/* Step 3 Fields Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Leader Name */}
                      <div className="space-y-1.5 sm:col-span-2">
                        <label
                          htmlFor="leader_name"
                          className="block text-xs font-medium text-[#A2ADA6]"
                        >
                          Full Name <span className="text-[#22A447] font-semibold">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#707E75]">
                            <User className="w-4 h-4" />
                          </div>
                          <input
                            type="text"
                            id="leader_name"
                            value={formData.leader.name}
                            onChange={(e) => handleLeaderChange('name', e.target.value)}
                            onKeyDown={handleInputKeyDown}
                            placeholder="Enter Team Leader's full name"
                            className={`w-full pl-9 pr-3.5 py-2.5 rounded-lg bg-[#171F1B] border text-sm text-[#F5F7F5] placeholder-[#5C6A62] focus:outline-none transition-all ${
                              errors.leader_name
                                ? 'border-rose-500/80 bg-rose-950/20 focus:ring-1 focus:ring-rose-500/50'
                                : 'border-[#28342D] hover:border-[#3A4B41] focus:border-[#22A447] focus:ring-1 focus:ring-[#22A447]'
                            }`}
                          />
                        </div>
                        {errors.leader_name && (
                          <p className="text-[11px] text-rose-400 font-medium">{errors.leader_name}</p>
                        )}
                      </div>

                      {/* Leader Email */}
                      <div className="space-y-1.5">
                        <label
                          htmlFor="leader_email"
                          className="block text-xs font-medium text-[#A2ADA6]"
                        >
                          Email Address <span className="text-[#22A447] font-semibold">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#707E75]">
                            <Mail className="w-4 h-4" />
                          </div>
                          <input
                            type="email"
                            id="leader_email"
                            value={formData.leader.email}
                            onChange={(e) => handleLeaderChange('email', e.target.value)}
                            onKeyDown={handleInputKeyDown}
                            placeholder="leader@jamiahamdard.ac.in"
                            className={`w-full pl-9 pr-3.5 py-2.5 rounded-lg bg-[#171F1B] border text-sm text-[#F5F7F5] placeholder-[#5C6A62] focus:outline-none transition-all ${
                              errors.leader_email
                                ? 'border-rose-500/80 bg-rose-950/20 focus:ring-1 focus:ring-rose-500/50'
                                : 'border-[#28342D] hover:border-[#3A4B41] focus:border-[#22A447] focus:ring-1 focus:ring-[#22A447]'
                            }`}
                          />
                        </div>
                        {errors.leader_email && (
                          <p className="text-[11px] text-rose-400 font-medium">{errors.leader_email}</p>
                        )}
                      </div>

                      {/* Leader Mobile */}
                      <div className="space-y-1.5">
                        <label
                          htmlFor="leader_mobile"
                          className="block text-xs font-medium text-[#A2ADA6]"
                        >
                          Mobile Number <span className="text-[#22A447] font-semibold">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#707E75]">
                            <Phone className="w-4 h-4" />
                          </div>
                          <input
                            type="tel"
                            id="leader_mobile"
                            value={formData.leader.mobile}
                            onChange={(e) => handleLeaderChange('mobile', e.target.value)}
                            onKeyDown={handleInputKeyDown}
                            placeholder="10-digit mobile number"
                            className={`w-full pl-9 pr-3.5 py-2.5 rounded-lg bg-[#171F1B] border text-sm text-[#F5F7F5] placeholder-[#5C6A62] focus:outline-none transition-all ${
                              errors.leader_mobile
                                ? 'border-rose-500/80 bg-rose-950/20 focus:ring-1 focus:ring-rose-500/50'
                                : 'border-[#28342D] hover:border-[#3A4B41] focus:border-[#22A447] focus:ring-1 focus:ring-[#22A447]'
                            }`}
                          />
                        </div>
                        {errors.leader_mobile && (
                          <p className="text-[11px] text-rose-400 font-medium">{errors.leader_mobile}</p>
                        )}
                      </div>

                      {/* Leader Department */}
                      <div className="space-y-1.5 sm:col-span-2">
                        <label
                          htmlFor="leader_department"
                          className="block text-xs font-medium text-[#A2ADA6]"
                        >
                          Department / Course <span className="text-[#22A447] font-semibold">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#707E75]">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <input
                            type="text"
                            id="leader_department"
                            list="leader_dept_list"
                            value={formData.leader.department}
                            onChange={(e) => handleLeaderChange('department', e.target.value)}
                            onKeyDown={handleInputKeyDown}
                            placeholder="e.g. Computer Science & Engineering"
                            className={`w-full pl-9 pr-3.5 py-2.5 rounded-lg bg-[#171F1B] border text-sm text-[#F5F7F5] placeholder-[#5C6A62] focus:outline-none transition-all ${
                              errors.leader_department
                                ? 'border-rose-500/80 bg-rose-950/20 focus:ring-1 focus:ring-rose-500/50'
                                : 'border-[#28342D] hover:border-[#3A4B41] focus:border-[#22A447] focus:ring-1 focus:ring-[#22A447]'
                            }`}
                          />
                          <datalist id="leader_dept_list">
                            {DEPARTMENT_SUGGESTIONS.map((dept) => (
                              <option key={dept} value={dept} />
                            ))}
                          </datalist>
                        </div>
                        {errors.leader_department && (
                          <p className="text-[11px] text-rose-400 font-medium">{errors.leader_department}</p>
                        )}
                      </div>
                    </div>

                    {/* Step 3 Actions */}
                    <div className="pt-4 border-t border-[#28342D] flex items-center justify-between">
                      <button
                        type="button"
                        onClick={handleBack}
                        className="px-4 py-2.5 rounded-lg bg-[#171F1B] hover:bg-[#1E2924] border border-[#28342D] text-xs sm:text-sm font-medium text-[#A2ADA6] hover:text-[#F5F7F5] flex items-center gap-1.5 transition-all"
                      >
                        <ArrowLeft className="w-4 h-4" /> Previous
                      </button>
                      <button
                        type="button"
                        onClick={handleContinue}
                        className="px-6 py-2.5 rounded-lg bg-[#22A447] hover:bg-[#1E943F] active:bg-[#1A8237] text-white text-sm font-semibold flex items-center gap-2 transition-all shadow-sm"
                      >
                        <span>Continue</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* ─── STEP 04: TEAM MEMBERS & REVIEW ───────────────────── */}
                {currentStep === 4 && (
                  <motion.div
                    key="step-4"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-6"
                  >
                    {/* Step Heading */}
                    <div className="border-b border-[#28342D] pb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[11px] text-[#22A447] font-semibold uppercase tracking-wider block">
                            Step 4 of 4
                          </span>
                          <h2 className="text-xl sm:text-2xl font-bold text-[#F5F7F5] mt-1">
                            Team Members & Review
                          </h2>
                          <p className="text-xs sm:text-sm text-[#A2ADA6] mt-0.5">
                            Enter remaining member details and verify your registration summary.
                          </p>
                        </div>
                        <span className="hidden sm:inline-block px-2.5 py-1 rounded bg-[#171F1B] border border-[#28342D] text-xs text-[#A2ADA6] font-medium">
                          {formData.teamSize || 3} Members Total
                        </span>
                      </div>
                    </div>

                    {/* Dynamic Member Cards Section */}
                    <div className="space-y-4">
                      {!formData.teamSize ? (
                        <div className="p-6 text-center rounded-xl bg-[#171F1B] border border-[#28342D] text-[#A2ADA6] text-xs sm:text-sm">
                          <p className="font-medium text-[#F5F7F5]">
                            Please select a team size in Step 1.
                          </p>
                          <button
                            type="button"
                            onClick={() => setCurrentStep(1)}
                            className="mt-2 text-xs text-[#22A447] font-semibold hover:underline"
                          >
                            Return to Step 1
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {Array.from({ length: additionalMembersCount }).map((_, idx) => {
                            const memberIndex = idx + 2;
                            const memberData = formData.members[idx] || {};
                            const memberErrors = {
                              name: errors[`member_${memberIndex}_name`],
                              email: errors[`member_${memberIndex}_email`],
                              mobile: errors[`member_${memberIndex}_mobile`],
                              department: errors[`member_${memberIndex}_department`]
                            };

                            return (
                              <MemberCard
                                key={memberIndex}
                                memberIndex={memberIndex}
                                data={memberData}
                                onChange={handleMemberChange}
                                errors={memberErrors}
                                onKeyDown={handleInputKeyDown}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Structured Registration Summary Table */}
                    <div className="pt-4 border-t border-[#28342D] space-y-3">
                      <h3 className="text-sm font-semibold text-[#F5F7F5] flex items-center gap-2">
                        <span>Registration Summary</span>
                      </h3>

                      <div className="rounded-xl bg-[#171F1B] border border-[#28342D] p-4 text-xs divide-y divide-[#28342D]/60">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-3">
                          <div>
                            <span className="text-[#707E75] block">Team Name</span>
                            <span className="font-semibold text-[#F5F7F5] block mt-0.5 truncate">
                              {formData.teamName || '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#707E75] block">Category Track</span>
                            <span className="font-semibold text-[#22A447] block mt-0.5 truncate">
                              {formData.category || '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#707E75] block">Team Size</span>
                            <span className="font-semibold text-[#F5F7F5] block mt-0.5">
                              {formData.teamSize ? `${formData.teamSize} Members` : '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#707E75] block">Faculty Mentor</span>
                            <span className="font-semibold text-[#F5F7F5] block mt-0.5 truncate">
                              {formData.facultyMentor || '—'}
                            </span>
                          </div>
                        </div>

                        <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[#A2ADA6]">
                          <div>
                            <span className="text-[#F5F7F5] font-medium">Team Leader: </span>
                            <span>{formData.leader.name || 'Not provided'} </span>
                            <span className="text-[#707E75]">({formData.leader.email || 'No email'})</span>
                          </div>
                          <span className="text-[#707E75] text-[11px]">
                            {formData.leader.department || ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Final Submission CTA Action */}
                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={handleBack}
                        disabled={submitting}
                        className="px-4 py-2.5 rounded-lg bg-[#171F1B] hover:bg-[#1E2924] border border-[#28342D] text-xs sm:text-sm font-medium text-[#A2ADA6] hover:text-[#F5F7F5] flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                      >
                        <ArrowLeft className="w-4 h-4" /> Previous
                      </button>

                      <button
                        type="button"
                        disabled={submitting}
                        onClick={handleSubmit}
                        className="w-full sm:w-auto px-7 py-3 rounded-lg bg-[#22A447] hover:bg-[#1E943F] active:bg-[#1A8237] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Confirming Registration...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Complete Registration</span>
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    )}
  </main>

      {/* Universal Website Footer */}
      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
