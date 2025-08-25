import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  Zap, ArrowRight, Globe, Shield, Clock, DollarSign,
  ChevronRight, Star, Users, TrendingUp, Search
} from 'lucide-react';
import { exchangeAPI } from '../services/api';

const countries = [
  { code: 'MEX', name: 'Mexico', flag: '🇲🇽', currency: 'MXN' },
  { code: 'PHL', name: 'Philippines', flag: '🇵🇭', currency: 'PHP' },
  { code: 'IND', name: 'India', flag: '🇮🇳', currency: 'INR' },
  { code: 'COL', name: 'Colombia', flag: '🇨🇴', currency: 'COP' },
  { code: 'GTM', name: 'Guatemala', flag: '🇬🇹', currency: 'GTQ' },
  { code: 'NGA', name: 'Nigeria', flag: '🇳🇬', currency: 'NGN' },
];

const features = [
  {
    icon: Globe,
    title: 'Global Reach',
    description: 'Send money to 15+ countries across Latin America, Asia, and Africa'
  },
  {
    icon: Shield,
    title: 'Bank-Level Security',
    description: 'Your money is protected with enterprise-grade encryption'
  },
  {
    icon: Clock,
    title: 'Lightning Fast',
    description: 'Most transfers arrive within minutes, not days'
  },
  {
    icon: DollarSign,
    title: 'Best Rates',
    description: 'Competitive exchange rates with transparent, low fees'
  },
];

const stats = [
  { value: '$2B+', label: 'Sent annually' },
  { value: '500K+', label: 'Happy customers' },
  { value: '15+', label: 'Countries' },
  { value: '4.9', label: 'App rating', icon: Star },
];

export default function Landing() {
  const [amount, setAmount] = useState('500');
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [rate, setRate] = useState(null);
  const [trackingRef, setTrackingRef] = useState('');

  useEffect(() => {
    async function fetchRate() {
      try {
        const response = await exchangeAPI.getRate('USD', selectedCountry.currency);
        setRate(response.data.rate);
      } catch (error) {
        // Use fallback rate
        const fallbackRates = { MXN: 17.15, PHP: 55.89, INR: 83.12, COP: 3950, GTQ: 7.82, NGN: 1550 };
        setRate(fallbackRates[selectedCountry.currency] || 17);
      }
    }
    fetchRate();
  }, [selectedCountry]);

  const receiveAmount = rate ? (parseFloat(amount || 0) * rate).toFixed(2) : '---';

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-dark-950/80 backdrop-blur-xl border-b border-dark-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-display font-bold text-white">RemitFlow</span>
            </Link>

            <div className="flex items-center gap-4">
              <Link to="/track" className="btn-ghost text-sm">
                <Search className="w-4 h-4" />
                Track Transfer
              </Link>
              <Link to="/login" className="btn-ghost text-sm hidden sm:flex">
                Sign In
              </Link>
              <Link to="/register" className="btn-primary text-sm">
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary-500/10 rounded-full blur-[128px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-accent-500/10 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left - Text */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 mb-6">
                <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
                <span className="text-sm text-primary-400 font-medium">New: Instant mobile wallet transfers</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-white leading-[1.1] tracking-tight">
                Send money home,
                <br />
                <span className="gradient-text">fast & secure</span>
              </h1>

              <p className="mt-6 text-lg text-dark-400 max-w-lg mx-auto lg:mx-0">
                The easiest way to send money to your loved ones abroad. Low fees, great rates, and transfers that arrive in minutes.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/register" className="btn-primary text-base py-4 px-8">
                  Start Sending
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link to="/track" className="btn-secondary text-base py-4 px-8">
                  Track a Transfer
                </Link>
              </div>

              {/* Stats */}
              <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-6">
                {stats.map(({ value, label, icon: Icon }) => (
                  <div key={label} className="text-center lg:text-left">
                    <div className="flex items-center gap-1 justify-center lg:justify-start">
                      <span className="text-2xl font-display font-bold text-white">{value}</span>
                      {Icon && <Icon className="w-5 h-5 text-accent-400 fill-accent-400" />}
                    </div>
                    <span className="text-sm text-dark-500">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - Calculator Card */}
            <div className="card p-6 sm:p-8 max-w-md mx-auto lg:mx-0 lg:ml-auto animate-in">
              <h2 className="text-xl font-display font-semibold text-white mb-6">
                Quick Quote
              </h2>

              {/* Send Amount */}
              <div className="space-y-2">
                <label className="text-sm text-dark-400">You send</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-dark-400">
                    <span className="text-lg">🇺🇸</span>
                    <span className="font-medium">USD</span>
                  </div>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="input pl-24 text-right text-2xl font-display font-semibold"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Exchange Rate */}
              <div className="my-4 py-4 border-y border-dark-800 flex items-center justify-between">
                <span className="text-sm text-dark-500">Exchange rate</span>
                <span className="font-mono text-dark-300">
                  1 USD = {rate?.toFixed(4) || '---'} {selectedCountry.currency}
                </span>
              </div>

              {/* Receive Amount */}
              <div className="space-y-2">
                <label className="text-sm text-dark-400">They receive</label>
                <div className="relative">
                  <select
                    value={selectedCountry.code}
                    onChange={(e) => setSelectedCountry(countries.find(c => c.code === e.target.value))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-transparent text-dark-300 font-medium cursor-pointer focus:outline-none"
                  >
                    {countries.map((c) => (
                      <option key={c.code} value={c.code} className="bg-dark-900">
                        {c.flag} {c.currency}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={receiveAmount}
                    readOnly
                    className="input pl-28 text-right text-2xl font-display font-semibold text-primary-400 bg-primary-500/5 border-primary-500/20"
                  />
                </div>
              </div>

              {/* Fee info */}
              <div className="mt-4 p-3 rounded-lg bg-dark-800/50 text-sm">
                <div className="flex justify-between text-dark-400">
                  <span>Transfer fee</span>
                  <span>${(parseFloat(amount || 0) * 0.015).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-dark-300 mt-1">
                  <span>Total to pay</span>
                  <span className="font-medium">${(parseFloat(amount || 0) * 1.015).toFixed(2)}</span>
                </div>
              </div>

              <Link to="/register" className="btn-primary w-full mt-6 py-4">
                Send Now
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Countries Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-y border-dark-800/50">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-dark-500 mb-6">Send money to</p>
          <div className="flex flex-wrap justify-center gap-4">
            {countries.map((country) => (
              <div
                key={country.code}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-dark-800/50 border border-dark-700"
              >
                <span className="text-xl">{country.flag}</span>
                <span className="text-dark-300">{country.name}</span>
              </div>
            ))}
            <Link
              to="/register"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 hover:bg-primary-500/20 transition-colors"
            >
              <span>+9 more</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-white">
              Why choose RemitFlow?
            </h2>
            <p className="mt-4 text-dark-400 max-w-2xl mx-auto">
              We've built the most reliable and user-friendly way to send money internationally.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, description }, index) => (
              <div
                key={title}
                className="card-hover p-6 text-center group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-primary-500/20 to-primary-600/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="w-7 h-7 text-primary-400" />
                </div>
                <h3 className="text-lg font-display font-semibold text-white mb-2">{title}</h3>
                <p className="text-dark-400 text-sm">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="card p-8 sm:p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-accent-500/10" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">
                Ready to send your first transfer?
              </h2>
              <p className="text-dark-400 mb-8 max-w-xl mx-auto">
                Join over 500,000 customers who trust RemitFlow to send money to their loved ones.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register" className="btn-primary text-base py-4 px-8">
                  Create Free Account
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link to="/track" className="btn-secondary text-base py-4 px-8">
                  Track Existing Transfer
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-800/50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-white">RemitFlow</span>
            </div>
            <p className="text-sm text-dark-500">
              © 2024 RemitFlow. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
