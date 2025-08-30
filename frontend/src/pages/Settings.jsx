import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import {
  User, Mail, Phone, MapPin, Shield, Bell, Lock,
  ChevronRight, Loader2, Check, Upload, AlertCircle, CheckCircle
} from 'lucide-react';

const kycStatusConfig = {
  none: {
    label: 'Not Started',
    color: 'text-dark-400',
    bgColor: 'bg-dark-700',
    icon: AlertCircle,
  },
  pending: {
    label: 'Under Review',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    icon: Loader2,
  },
  verified: {
    label: 'Verified',
    color: 'text-primary-400',
    bgColor: 'bg-primary-500/10',
    icon: CheckCircle,
  },
  rejected: {
    label: 'Rejected',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    icon: AlertCircle,
  },
};

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [kycSubmitting, setKycSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      street: user?.address?.street || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      postalCode: user?.address?.postalCode || '',
      country: user?.address?.country || 'US',
    },
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'verification', label: 'Verification', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  const onSubmitProfile = async (data) => {
    setSaving(true);
    try {
      await userAPI.updateProfile({
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
      });
      await userAPI.updateAddress({
        street: data.street,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
      });
      await refreshUser();
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleKycSubmit = async () => {
    setKycSubmitting(true);
    try {
      await userAPI.submitKyc({
        documentType: 'passport',
        documentNumber: 'DEMO123456',
      });
      await refreshUser();
      toast.success('Verification submitted successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit verification');
    } finally {
      setKycSubmitting(false);
    }
  };

  const kycStatus = kycStatusConfig[user?.kycStatus || 'none'];
  const KycIcon = kycStatus.icon;

  return (
    <div className="max-w-4xl mx-auto animate-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">Settings</h1>
        <p className="text-dark-400 mt-1">Manage your account settings and preferences.</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                  activeTab === id
                    ? 'bg-dark-800 text-white'
                    : 'text-dark-400 hover:text-dark-200 hover:bg-dark-800/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="card p-6">
              <h2 className="text-lg font-display font-semibold text-white mb-6">
                Personal Information
              </h2>

              <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-6">
                {/* Name */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">
                      First name
                    </label>
                    <input
                      type="text"
                      {...register('firstName', { required: 'First name is required' })}
                      className={`input ${errors.firstName ? 'input-error' : ''}`}
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-400">{errors.firstName.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">
                      Last name
                    </label>
                    <input
                      type="text"
                      {...register('lastName', { required: 'Last name is required' })}
                      className={`input ${errors.lastName ? 'input-error' : ''}`}
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-400">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                {/* Email (read-only) */}
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Email address
                  </label>
                  <div className="input bg-dark-800/50 text-dark-400 cursor-not-allowed flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {user?.email}
                  </div>
                  <p className="mt-1 text-xs text-dark-500">
                    Contact support to change your email address
                  </p>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Phone number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                    <input
                      type="tel"
                      {...register('phone')}
                      className="input pl-11"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="pt-4 border-t border-dark-800">
                  <h3 className="text-sm font-medium text-dark-300 mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Address
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-dark-400 mb-2">
                        Street address
                      </label>
                      <input
                        type="text"
                        {...register('street')}
                        className="input"
                        placeholder="123 Main Street"
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-dark-400 mb-2">
                          City
                        </label>
                        <input
                          type="text"
                          {...register('city')}
                          className="input"
                          placeholder="New York"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-dark-400 mb-2">
                          State / Province
                        </label>
                        <input
                          type="text"
                          {...register('state')}
                          className="input"
                          placeholder="NY"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-dark-400 mb-2">
                          Postal code
                        </label>
                        <input
                          type="text"
                          {...register('postalCode')}
                          className="input"
                          placeholder="10001"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-dark-400 mb-2">
                          Country
                        </label>
                        <select {...register('country')} className="input">
                          <option value="US">United States</option>
                          <option value="CA">Canada</option>
                          <option value="GB">United Kingdom</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={saving || !isDirty}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="card p-6">
                <h2 className="text-lg font-display font-semibold text-white mb-6">
                  Change Password
                </h2>
                
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">
                      Current password
                    </label>
                    <input type="password" className="input" placeholder="••••••••" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">
                      New password
                    </label>
                    <input type="password" className="input" placeholder="••••••••" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">
                      Confirm new password
                    </label>
                    <input type="password" className="input" placeholder="••••••••" />
                  </div>
                  <div className="flex justify-end pt-2">
                    <button type="button" className="btn-primary">
                      Update Password
                    </button>
                  </div>
                </form>
              </div>

              <div className="card p-6">
                <h2 className="text-lg font-display font-semibold text-white mb-4">
                  Two-Factor Authentication
                </h2>
                <p className="text-dark-400 text-sm mb-4">
                  Add an extra layer of security to your account by enabling two-factor authentication.
                </p>
                <button className="btn-secondary">
                  <Shield className="w-5 h-5" />
                  Enable 2FA
                </button>
              </div>

              <div className="card p-6 border-red-500/20">
                <h2 className="text-lg font-display font-semibold text-red-400 mb-4">
                  Danger Zone
                </h2>
                <p className="text-dark-400 text-sm mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <button className="btn-secondary border-red-500/30 text-red-400 hover:bg-red-500/10">
                  Delete Account
                </button>
              </div>
            </div>
          )}

          {/* Verification Tab */}
          {activeTab === 'verification' && (
            <div className="space-y-6">
              {/* Status Card */}
              <div className="card p-6">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl ${kycStatus.bgColor} flex items-center justify-center`}>
                    <KycIcon className={`w-6 h-6 ${kycStatus.color} ${user?.kycStatus === 'pending' ? 'animate-spin' : ''}`} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-display font-semibold text-white">
                      Verification Status
                    </h2>
                    <p className={`text-sm font-medium ${kycStatus.color} mt-1`}>
                      {kycStatus.label}
                    </p>
                  </div>
                </div>
              </div>

              {/* Verification Form (only if not verified) */}
              {user?.kycStatus !== 'verified' && user?.kycStatus !== 'pending' && (
                <div className="card p-6">
                  <h2 className="text-lg font-display font-semibold text-white mb-4">
                    Verify Your Identity
                  </h2>
                  <p className="text-dark-400 text-sm mb-6">
                    To unlock higher transfer limits and all features, please verify your identity by
                    providing a government-issued ID.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">
                        Document Type
                      </label>
                      <select className="input">
                        <option value="passport">Passport</option>
                        <option value="drivers_license">Driver's License</option>
                        <option value="national_id">National ID Card</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">
                        Upload Document
                      </label>
                      <div className="border-2 border-dashed border-dark-700 rounded-xl p-8 text-center hover:border-dark-600 transition-colors cursor-pointer">
                        <Upload className="w-8 h-8 text-dark-500 mx-auto mb-3" />
                        <p className="text-dark-400 text-sm">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-dark-600 text-xs mt-1">
                          PNG, JPG or PDF up to 10MB
                        </p>
                      </div>
                    </div>

                    <div className="bg-dark-800/50 rounded-xl p-4">
                      <p className="text-xs text-dark-500">
                        <strong className="text-dark-400">Demo Mode:</strong> Click submit to simulate
                        a successful verification. In production, this would require actual document
                        upload and verification.
                      </p>
                    </div>

                    <button
                      onClick={handleKycSubmit}
                      disabled={kycSubmitting}
                      className="btn-primary w-full disabled:opacity-50"
                    >
                      {kycSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Shield className="w-5 h-5" />
                          Submit for Verification
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Benefits */}
              <div className="card p-6">
                <h3 className="text-lg font-display font-semibold text-white mb-4">
                  Benefits of Verification
                </h3>
                <ul className="space-y-3">
                  {[
                    'Send up to $10,000 per transfer',
                    'Faster transfer processing',
                    'Priority customer support',
                    'Access to all delivery methods',
                  ].map((benefit) => (
                    <li key={benefit} className="flex items-center gap-3 text-dark-300">
                      <div className="w-5 h-5 rounded-full bg-primary-500/20 flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-400" />
                      </div>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="card p-6">
              <h2 className="text-lg font-display font-semibold text-white mb-6">
                Notification Preferences
              </h2>

              <div className="space-y-6">
                {[
                  {
                    title: 'Transfer Updates',
                    description: 'Get notified when your transfers are processed or completed',
                    defaultChecked: true,
                  },
                  {
                    title: 'Promotional Emails',
                    description: 'Receive special offers, promotions, and news',
                    defaultChecked: false,
                  },
                  {
                    title: 'Security Alerts',
                    description: 'Get alerts about suspicious activity on your account',
                    defaultChecked: true,
                  },
                  {
                    title: 'Rate Alerts',
                    description: 'Get notified when exchange rates change significantly',
                    defaultChecked: false,
                  },
                ].map((notification) => (
                  <div
                    key={notification.title}
                    className="flex items-start justify-between gap-4 pb-4 border-b border-dark-800 last:border-0 last:pb-0"
                  >
                    <div>
                      <h3 className="font-medium text-white">{notification.title}</h3>
                      <p className="text-sm text-dark-400 mt-1">{notification.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked={notification.defaultChecked}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-dark-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-dark-400 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500 peer-checked:after:bg-white"></div>
                    </label>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-6">
                <button className="btn-primary">
                  <Check className="w-5 h-5" />
                  Save Preferences
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
