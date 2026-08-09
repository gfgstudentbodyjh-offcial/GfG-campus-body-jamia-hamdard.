import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import cacheService from '../services/cacheService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [member, setMember] = useState(null);
  const [adminAccess, setAdminAccess] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('gfg_token') || '');
  const [loading, setLoading] = useState(true);

  // Global Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login'); // 'login' | 'signup'
  const [authReason, setAuthReason] = useState('sign in to continue');

  const openAuthModal = (tab = 'login', reason = 'sign in to continue') => {
    setAuthModalTab(tab);
    setAuthReason(reason);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const requireAuthAction = (callback, actionName = 'interact with community') => {
    if (!user) {
      openAuthModal('login', actionName);
      return false;
    }
    if (callback) callback();
    return true;
  };

  useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        setUser(null);
        setMember(null);
        setAdminAccess(null);
        setLoading(false);
        return;
      }

      try {
        const res = await cacheService.dedupe('auth_me', () => api.get('/auth/me'));
        if (res.data.success || res.data.user) {
          setUser(res.data.user);
          setMember(res.data.member || null);
          setAdminAccess(res.data.adminAccess || null);
        } else {
          throw new Error('Invalid token response');
        }
      } catch (err) {
        console.warn('Token verification failed:', err.message);
        localStorage.removeItem('gfg_token');
        setToken('');
        setUser(null);
        setMember(null);
        setAdminAccess(null);
      }
      setLoading(false);
    };
    checkAuth();
  }, [token]);

  // Standard User Login
  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token: newToken, user: userData, member: memberData, adminAccess: adminData } = res.data;
      localStorage.setItem('gfg_token', newToken);
      setToken(newToken);
      setUser(userData);
      setMember(memberData);
      setAdminAccess(adminData || null);
      closeAuthModal();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Invalid email or password.'
      };
    }
  };

  // 3-Factor Super Admin Login (Email + Password + Admin PIN)
  const adminLogin = async (email, password, pin) => {
    try {
      const res = await api.post('/auth/admin-login', { email, password, pin });
      const { token: newToken, user: userData, member: memberData, adminAccess: adminData } = res.data;
      localStorage.setItem('gfg_token', newToken);
      setToken(newToken);
      setUser(userData);
      setMember(memberData);
      setAdminAccess(adminData || null);
      closeAuthModal();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Invalid administrative credentials.'
      };
    }
  };

  const signup = async (signupData) => {
    try {
      const res = await api.post('/auth/signup', signupData);
      const { token: newToken, user: userData, member: memberData } = res.data;
      localStorage.setItem('gfg_token', newToken);
      setToken(newToken);
      setUser(userData);
      setMember(memberData);
      closeAuthModal();
      return { success: true, message: res.data.message };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Registration failed. Please check details.'
      };
    }
  };

  const changePassword = async (currentPassword, newPassword, confirmPassword) => {
    try {
      const res = await api.patch('/auth/change-password', {
        currentPassword,
        newPassword,
        confirmPassword
      });
      return {
        success: true,
        message: res.data.message || '✓ Password updated successfully.'
      };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to change password. Please check your credentials.'
      };
    }
  };

  const changeAdminPin = async (currentPin, newPin, confirmPin) => {
    try {
      const res = await api.patch('/auth/change-admin-pin', {
        currentPin,
        newPin,
        confirmPin
      });
      return {
        success: true,
        message: res.data.message || '✓ Admin PIN updated successfully.'
      };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to change Admin PIN.'
      };
    }
  };

  const logout = () => {
    if (member?._id) {
      cacheService.clearUserCache(member._id);
    }
    cacheService.clearAdminCache();
    localStorage.removeItem('gfg_token');
    setToken('');
    setUser(null);
    setMember(null);
    setAdminAccess(null);
    try {
      api.post('/auth/logout');
    } catch (e) {}
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await api.get('/auth/me');
      if (res.data.user) {
        setUser(res.data.user);
        setMember(res.data.member || null);
        setAdminAccess(res.data.adminAccess || null);
      }
    } catch (e) {}
  };

  return (
    <AuthContext.Provider value={{
      user,
      member,
      adminAccess,
      token,
      loading,
      login,
      adminLogin,
      signup,
      changePassword,
      changeAdminPin,
      logout,
      refreshUser,
      isAuthenticated: !!user,
      isAdminAuthenticated: !!adminAccess && adminAccess.adminRole,
      isAuthModalOpen,
      authModalTab,
      authReason,
      openAuthModal,
      closeAuthModal,
      setAuthModalTab,
      requireAuthAction
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
