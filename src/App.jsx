import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Public Pages
import Home from './pages/public/Home';
import TeamsPage from './pages/public/TeamsPage';
import EventsPage from './pages/public/EventsPage';
import GalleryPage from './pages/public/GalleryPage';
import ResourcesPage from './pages/public/ResourcesPage';
import CampusMantriHistory from './pages/public/CampusMantriHistory';
import FormViewerPage from './pages/public/FormViewerPage';
import CommunityFeed from './pages/public/CommunityFeed';
import PostDetailPage from './pages/public/PostDetailPage';
import LeaderboardPage from './pages/public/LeaderboardPage';
import ProfilePage from './pages/public/ProfilePage';
import MemberVerificationPage from './pages/public/MemberVerificationPage';
import MembersPage from './pages/public/MembersPage';
import RegistrationPage from './pages/public/RegistrationPage';

// Admin Pages & Protected Layout (Lazy Loaded to minimize public bundle size)
import ProtectedRoute from './components/common/ProtectedRoute';
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboardHome = lazy(() => import('./pages/admin/AdminDashboardHome'));
const MembersAdmin = lazy(() => import('./pages/admin/MembersAdmin'));
const TeamsAdmin = lazy(() => import('./pages/admin/TeamsAdmin'));
const FacultyAdmin = lazy(() => import('./pages/admin/FacultyAdmin'));
const MantriAdmin = lazy(() => import('./pages/admin/MantriAdmin'));
const EventsAdmin = lazy(() => import('./pages/admin/EventsAdmin'));
const GalleryAdmin = lazy(() => import('./pages/admin/GalleryAdmin'));
const ResourcesAdmin = lazy(() => import('./pages/admin/ResourcesAdmin'));
const AnnouncementsAdmin = lazy(() => import('./pages/admin/AnnouncementsAdmin'));
const FormsAdmin = lazy(() => import('./pages/admin/FormsAdmin'));
const MediaLibraryAdmin = lazy(() => import('./pages/admin/MediaLibraryAdmin'));
const HeroSettingsAdmin = lazy(() => import('./pages/admin/HeroSettingsAdmin'));
const AnalyticsSettingsAdmin = lazy(() => import('./pages/admin/AnalyticsSettingsAdmin'));
const FeedModerationAdmin = lazy(() => import('./pages/admin/FeedModerationAdmin'));
const AdministratorsAdmin = lazy(() => import('./pages/admin/AdministratorsAdmin'));
const UserDirectoryAdmin = lazy(() => import('./pages/admin/UserDirectoryAdmin'));
const LaunchSettingsAdmin = lazy(() => import('./pages/admin/LaunchSettingsAdmin'));

import ScrollToTop from './components/common/ScrollToTop';
import ErrorBoundary from './components/common/ErrorBoundary';

const AdminLoadingFallback = () => (
  <div className="min-h-screen bg-[#0a0d12] text-gray-200 flex flex-col items-center justify-center font-mono">
    <div className="w-8 h-8 border-2 border-[#2f9e44] border-t-transparent rounded-full animate-spin mb-3"></div>
    <span className="text-xs text-gray-400">Loading Admin Dashboard...</span>
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <ScrollToTop />
      <ErrorBoundary>
        <Routes>
        {/* Public & Member Space Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/teams" element={<TeamsPage />} />
        <Route path="/members" element={<MembersPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/campus-mantri" element={<CampusMantriHistory />} />
        <Route path="/mantri-history" element={<CampusMantriHistory />} />
        <Route path="/forms/:formId" element={<FormViewerPage />} />
        <Route path="/community" element={<CommunityFeed />} />
        <Route path="/community/post/:postId" element={<PostDetailPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/:username" element={<ProfilePage />} />
        <Route path="/members/:memberId" element={<ProfilePage />} />
        <Route path="/verify/member/:verificationId" element={<MemberVerificationPage />} />
        <Route path="/registration" element={<RegistrationPage />} />

        {/* Super Admin Login */}
        <Route
          path="/admin/login"
          element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <AdminLogin />
            </Suspense>
          }
        />

        {/* Protected Super Admin SaaS Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Suspense fallback={<AdminLoadingFallback />}>
                <AdminLayout />
              </Suspense>
            </ProtectedRoute>
          }
        >
          <Route index element={<Suspense fallback={<AdminLoadingFallback />}><AdminDashboardHome /></Suspense>} />
          <Route path="users" element={<Suspense fallback={<AdminLoadingFallback />}><UserDirectoryAdmin /></Suspense>} />
          <Route path="members" element={<Suspense fallback={<AdminLoadingFallback />}><MembersAdmin /></Suspense>} />
          <Route path="teams" element={<Suspense fallback={<AdminLoadingFallback />}><TeamsAdmin /></Suspense>} />
          <Route path="faculty" element={<Suspense fallback={<AdminLoadingFallback />}><FacultyAdmin /></Suspense>} />
          <Route path="mantri" element={<Suspense fallback={<AdminLoadingFallback />}><MantriAdmin /></Suspense>} />
          <Route path="events" element={<Suspense fallback={<AdminLoadingFallback />}><EventsAdmin /></Suspense>} />
          <Route path="gallery" element={<Suspense fallback={<AdminLoadingFallback />}><GalleryAdmin /></Suspense>} />
          <Route path="resources" element={<Suspense fallback={<AdminLoadingFallback />}><ResourcesAdmin /></Suspense>} />
          <Route path="announcements" element={<Suspense fallback={<AdminLoadingFallback />}><AnnouncementsAdmin /></Suspense>} />
          <Route path="forms" element={<Suspense fallback={<AdminLoadingFallback />}><FormsAdmin /></Suspense>} />
          <Route path="media" element={<Suspense fallback={<AdminLoadingFallback />}><MediaLibraryAdmin /></Suspense>} />
          <Route path="hero-settings" element={<Suspense fallback={<AdminLoadingFallback />}><HeroSettingsAdmin /></Suspense>} />
          <Route path="analytics-settings" element={<Suspense fallback={<AdminLoadingFallback />}><AnalyticsSettingsAdmin /></Suspense>} />
          <Route path="feed-moderation" element={<Suspense fallback={<AdminLoadingFallback />}><FeedModerationAdmin /></Suspense>} />
          <Route path="administrators" element={<Suspense fallback={<AdminLoadingFallback />}><AdministratorsAdmin /></Suspense>} />
          <Route path="launch-settings" element={<Suspense fallback={<AdminLoadingFallback />}><LaunchSettingsAdmin /></Suspense>} />
        </Route>

        {/* Fallback Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </ErrorBoundary>
    </AuthProvider>
  );
}
