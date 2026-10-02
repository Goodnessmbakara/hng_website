'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signIn, signOut } from 'next-auth/react';
import {
  ShoppingBag,
  Search,
  User,
  LogOut,
  Zap,
  Menu,
  X,
  Package,
  Mail,
  Lock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Loader2,
  Eye,
  EyeOff,
  UserPlus,
  MailCheck,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';

interface HeaderProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export default function Header({ searchQuery = '', onSearchChange }: HeaderProps) {
  const { data: session, status } = useSession();
  const { totalItems, toggleCart } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // Authentication modal form state
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState<string | null>(null);
  const [signupDevCode, setSignupDevCode] = useState<string | null>(null);

  const handleAuthSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const targetEmail = emailInput.trim().toLowerCase();
    const targetName = nameInput.trim();

    if (!targetEmail || !targetEmail.includes('@')) {
      setAuthError('Please enter a valid email address.');
      return;
    }

    setAuthLoading(true);
    setAuthError(null);

    if (authMode === 'signup') {
      if (passwordInput && passwordInput.length < 6) {
        setAuthError('Password must be at least 6 characters.');
        setAuthLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: targetEmail,
            name: targetName || undefined,
            password: passwordInput || 'TechHaven123!',
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          setAuthError(data.error || 'Registration failed.');
          setAuthLoading(false);
        } else {
          setSignupSuccess(targetEmail);
          if (data.devCode) setSignupDevCode(data.devCode);
          setAuthLoading(false);
        }
      } catch (err: any) {
        setAuthError(err?.message || 'Registration failed.');
        setAuthLoading(false);
      }
      return;
    }

    // Sign in flow
    try {
      const res = await signIn('credentials', {
        email: targetEmail,
        password: passwordInput || undefined,
        name: targetName || undefined,
        redirect: false,
      });

      if (res?.error) {
        setAuthError(res.error || 'Failed to sign in. Please verify your credentials.');
      } else {
        setAuthModalOpen(false);
        setEmailInput('');
        setNameInput('');
        setPasswordInput('');
        window.location.reload();
      }
    } catch (err: any) {
      setAuthError(err?.message || 'An unexpected error occurred.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleDemoLogin = async (email: string, name: string) => {
    setEmailInput(email);
    setNameInput(name);
    setAuthLoading(true);
    setAuthError(null);

    try {
      const res = await signIn('credentials', {
        email,
        name,
        redirect: false,
      });

      if (res?.error) {
        setAuthError(res.error);
      } else {
        setAuthModalOpen(false);
        window.location.reload();
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Demo login failed.');
    } finally {
      setAuthLoading(false);
    }
  };


  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/90 transition-colors">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Zap className="h-5 w-5 fill-current" />
              </div>
              <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                Tech<span className="text-blue-600">Haven</span>
              </span>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
              <Link href="/" className="hover:text-blue-600 transition-colors">Store</Link>
              <Link href="/checkout" className="hover:text-blue-600 transition-colors">Checkout</Link>
              <Link href="/orders" className="hover:text-blue-600 transition-colors flex items-center gap-1.5">
                <span>Orders</span>
              </Link>
            </nav>
          </div>

          {/* Search Bar */}
          <div className="hidden lg:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search tech, audio, laptops..."
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:bg-slate-950 transition-all"
              />
            </div>
          </div>

          {/* Right actions: Auth & Cart */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Auth Button */}
            {status === 'loading' ? (
              <div className="h-9 w-24 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
            ) : session?.user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 rounded-full border border-slate-200 p-1 pr-3 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800 transition-colors"
                >
                  {session.user.image && !avatarError ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      width={28}
                      height={28}
                      className="rounded-full"
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                      {session.user.name?.charAt(0) || session.user.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <span className="hidden sm:inline text-xs font-medium text-slate-700 dark:text-slate-200 max-w-[100px] truncate">
                    {session.user.name?.split(' ')[0] || session.user.email?.split('@')[0]}
                  </span>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {session.user.name || 'Customer'}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {session.user.email}
                      </p>
                      {(session.user as any)?.emailVerified ? (
                        <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <ShieldCheck className="h-3 w-3" />
                          <span>Verified Account</span>
                        </div>
                      ) : (
                        <Link
                          href={`/auth/verify-email?email=${encodeURIComponent(session.user.email || '')}`}
                          onClick={() => setUserDropdownOpen(false)}
                          className="mt-1.5 flex items-center justify-between px-2.5 py-1 rounded-lg bg-amber-50 text-[10px] font-bold text-amber-800 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800 transition-colors"
                        >
                          <span>⚠️ Unverified Email</span>
                          <span className="underline">Verify →</span>
                        </Link>
                      )}
                    </div>
                    <Link
                      href="/orders"
                      onClick={() => setUserDropdownOpen(false)}
                      className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Package className="h-3.5 w-3.5 text-blue-600" />
                      Order History
                    </Link>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        signOut();
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {/* Unified Sign In Trigger (Opens Modal with Email & Google options) */}
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-all active:scale-95"
                >
                  <User className="h-3.5 w-3.5" />
                  <span>Sign In</span>
                </button>

                {/* Direct 1-Click Google Button */}
                <button
                  onClick={() => signIn('google')}
                  className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-all active:scale-95"
                  title="Sign in instantly using Google OAuth"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Google</span>
                </button>
              </div>
            )}

            {/* Cart Drawer Trigger Button */}
            <button
              onClick={toggleCart}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 transition-all active:scale-95"
              aria-label="View shopping cart"
            >
              <ShoppingBag className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white ring-2 ring-white dark:ring-slate-900 animate-in zoom-in-50 duration-200">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 px-4 py-4 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-3">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
            </div>
            <div className="flex flex-col gap-2 pt-2 text-sm font-medium">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900"
              >
                Shop All Products
              </Link>
              <Link
                href="/checkout"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900"
              >
                Checkout Page
              </Link>
              <Link
                href="/orders"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900"
              >
                Order History
              </Link>

              {!session?.user && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setAuthModalOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white"
                  >
                    <User className="h-4 w-4" />
                    Sign In (Email & Google)
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Authentication Modal */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => {
                setAuthModalOpen(false);
                setSignupSuccess(null);
                setAuthError(null);
              }}
              className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-2.5 mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {signupSuccess ? 'Check Your Inbox' : authMode === 'signin' ? 'Sign In to TechHaven' : 'Create TechHaven Account'}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Cross-device real-time cart sync & order security
                </p>
              </div>
            </div>

            {/* Error Notification */}
            {authError && (
              <div className="mb-3.5 rounded-xl bg-red-50 p-2.5 text-xs text-red-600 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-900">
                {authError}
              </div>
            )}

            {/* If registered successfully, show confirmation instructions */}
            {signupSuccess ? (
              <div className="space-y-3.5 py-2 text-center animate-in fade-in">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <MailCheck className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Verification Code Dispatched!
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  We sent a 6-digit confirmation code to:
                  <br />
                  <strong className="text-blue-600 dark:text-blue-400 font-mono text-xs">{signupSuccess}</strong>
                </p>

                {signupDevCode && (
                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-center">
                    <span className="text-[10px] text-slate-500 block mb-0.5">Verification Code:</span>
                    <span className="font-mono text-xl font-black tracking-widest text-blue-600 dark:text-blue-400">
                      {signupDevCode}
                    </span>
                  </div>
                )}

                <div className="pt-2 space-y-2">
                  <Link
                    href={`/auth/verify-email?email=${encodeURIComponent(signupSuccess)}${signupDevCode ? `&code=${encodeURIComponent(signupDevCode)}` : ''}`}
                    onClick={() => setAuthModalOpen(false)}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all"
                  >
                    <span>Verify Email Now</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setSignupSuccess(null);
                      setAuthMode('signin');
                    }}
                    className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    Back to Sign In
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Tabs: Sign In vs Sign Up */}
                <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800 mb-4">
                  <button
                    type="button"
                    onClick={() => { setAuthMode('signin'); setAuthError(null); }}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                      authMode === 'signin'
                        ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('signup'); setAuthError(null); }}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                      authMode === 'signup'
                        ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                {/* Google Sign In Button */}
                <button
                  type="button"
                  onClick={() => signIn('google')}
                  className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white py-2 px-4 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750 transition-all active:scale-[0.98]"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{authMode === 'signin' ? 'Continue with Google' : 'Sign up with Google'}</span>
                </button>

                {/* Divider */}
                <div className="relative my-3.5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
                    <span className="bg-white px-2 text-slate-400 dark:bg-slate-900">
                      Or with email
                    </span>
                  </div>
                </div>

                {/* Email Form */}
                <form onSubmit={handleAuthSubmit} className="space-y-2.5">
                  {authMode === 'signup' && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. John Doe"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-800/60 dark:text-white"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Account Email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="you@domain.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-800/60 dark:text-white"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Password
                      </label>
                      {authMode === 'signin' && (
                        <Link
                          href="/auth/forgot-password"
                          onClick={() => setAuthModalOpen(false)}
                          className="text-[11px] text-blue-600 hover:text-blue-500 dark:text-blue-400"
                        >
                          Forgot?
                        </Link>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder={authMode === 'signin' ? '•••••••• (or leave empty for 1-click)' : 'Minimum 6 characters'}
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-3 pr-8 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-800/60 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full mt-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-60 transition-all active:scale-[0.98]"
                  >
                    {authLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span>{authMode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </form>

                {/* Quick 1-Tap Demo Accounts */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-amber-500" />
                    <span>Quick 1-Tap Test Profiles:</span>
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleDemoLogin('demo.shopper@techhaven.com', 'Demo Shopper')}
                      className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:bg-blue-950/30 text-left transition-colors"
                    >
                      <span className="block text-[11px] font-bold text-slate-800 dark:text-slate-200">Demo Shopper</span>
                      <span className="block text-[9px] text-slate-500 truncate">demo.shopper@techhaven.com</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDemoLogin('alice.tech@gmail.com', 'Alice Tech')}
                      className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:bg-blue-950/30 text-left transition-colors"
                    >
                      <span className="block text-[11px] font-bold text-slate-800 dark:text-slate-200">Alice Tech</span>
                      <span className="block text-[9px] text-slate-500 truncate">alice.tech@gmail.com</span>
                    </button>
                  </div>
                </div>

                {/* Link to Full Page */}
                <div className="mt-3 pt-2 text-center border-t border-slate-100 dark:border-slate-800">
                  <Link
                    href={authMode === 'signin' ? '/auth/signin' : '/auth/signup'}
                    onClick={() => setAuthModalOpen(false)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <span>Open dedicated full-screen authentication</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

