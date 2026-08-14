import React from 'react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import MembersSection from '../../components/common/MembersSection';
import TechHeader from '../../components/common/TechHeader';

export default function MembersPage() {
  return (
    <div className="min-h-screen bg-transparent text-gray-100 flex flex-col font-sans">
      <Navbar />
      
      <main className="flex-1 py-6 sm:py-8">
        {/* Reusable Public Members Section Component */}
        <MembersSection />
      </main>

      <Footer />
    </div>
  );
}
