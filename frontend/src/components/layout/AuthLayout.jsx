import { Outlet, Link } from 'react-router-dom';
import { Zap, Globe, Shield, Clock } from 'lucide-react';

const features = [
  { icon: Globe, text: 'Send to 15+ countries' },
  { icon: Shield, text: 'Bank-level security' },
  { icon: Clock, text: 'Transfers in minutes' },
];

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-2/5 bg-gradient-to-br from-dark-900 via-dark-900 to-primary-950/50 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-display font-bold text-white">RemitFlow</span>
          </Link>

          {/* Main content */}
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl xl:text-5xl font-display font-bold text-white leading-tight">
                Send money <br />
                <span className="gradient-text">anywhere</span> in<br />
                the world
              </h1>
              <p className="mt-4 text-lg text-dark-400 max-w-md">
                Fast, secure, and affordable international transfers to the people who matter most.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              {features.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary-400" />
                  </div>
                  <span className="text-dark-300">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-sm text-dark-500">
            © 2024 RemitFlow. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link to="/" className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-display font-bold text-white">RemitFlow</span>
          </Link>

          <Outlet />
        </div>
      </div>
    </div>
  );
}
