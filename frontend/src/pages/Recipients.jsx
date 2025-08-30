import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import {
  Plus, User, Search, MoreVertical, Edit2, Trash2,
  Building2, Smartphone, Banknote, X, Loader2, Send
} from 'lucide-react';
import { useRecipients, useCountries } from '../hooks/useData';
import { recipientAPI } from '../services/api';

const deliveryMethodIcons = {
  bank_deposit: Building2,
  mobile_wallet: Smartphone,
  cash_pickup: Banknote,
};

const deliveryMethodLabels = {
  bank_deposit: 'Bank Deposit',
  mobile_wallet: 'Mobile Wallet',
  cash_pickup: 'Cash Pickup',
};

export default function Recipients() {
  const { recipients, loading, refetch } = useRecipients();
  const { countries } = useCountries();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecipient, setEditingRecipient] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm();

  const selectedCountry = watch('country');
  const selectedDeliveryMethod = watch('deliveryMethod');
  const countryData = countries.find((c) => c.code === selectedCountry);

  const filteredRecipients = recipients.filter((r) => {
    const name = `${r.firstName} ${r.lastName}`.toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  const openAddModal = () => {
    reset({});
    setEditingRecipient(null);
    setShowAddModal(true);
  };

  const openEditModal = (recipient) => {
    setEditingRecipient(recipient);
    reset({
      firstName: recipient.firstName,
      lastName: recipient.lastName,
      country: recipient.country,
      deliveryMethod: recipient.deliveryMethod,
      bankName: recipient.bankName,
      accountNumber: recipient.accountNumber,
      mobileNumber: recipient.mobileNumber,
      phone: recipient.phone,
    });
    setShowAddModal(true);
    setActiveMenu(null);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingRecipient(null);
    reset({});
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      if (editingRecipient) {
        await recipientAPI.update(editingRecipient.id, data);
        toast.success('Recipient updated');
      } else {
        await recipientAPI.create(data);
        toast.success('Recipient added');
      }
      await refetch();
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save recipient');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await recipientAPI.delete(id);
      toast.success('Recipient deleted');
      await refetch();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete recipient');
    } finally {
      setDeletingId(null);
      setActiveMenu(null);
    }
  };

  const getCountryInfo = (code) => countries.find((c) => c.code === code);

  return (
    <div className="max-w-4xl mx-auto animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Recipients</h1>
          <p className="text-dark-400 mt-1">Manage your saved recipients</p>
        </div>
        <button onClick={openAddModal} className="btn-primary">
          <Plus className="w-5 h-5" />
          Add Recipient
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input pl-12"
          placeholder="Search recipients..."
        />
      </div>

      {/* Recipients List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-dark-500" />
        </div>
      ) : filteredRecipients.length === 0 ? (
        <div className="card p-12 text-center">
          <User className="w-16 h-16 text-dark-700 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-dark-200 mb-2">
            {searchQuery ? 'No recipients found' : 'No recipients yet'}
          </h3>
          <p className="text-dark-500 mb-6">
            {searchQuery
              ? 'Try a different search term'
              : 'Add your first recipient to get started'}
          </p>
          {!searchQuery && (
            <button onClick={openAddModal} className="btn-primary">
              <Plus className="w-5 h-5" />
              Add Recipient
            </button>
          )}
        </div>
      ) : (
        <div className="card divide-y divide-dark-800">
          {filteredRecipients.map((recipient) => {
            const country = getCountryInfo(recipient.country);
            const DeliveryIcon = deliveryMethodIcons[recipient.deliveryMethod];
            return (
              <div
                key={recipient.id}
                className="flex items-center gap-4 p-4 hover:bg-dark-800/30 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-dark-800 flex items-center justify-center text-2xl">
                  {country?.flag || '🌍'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-dark-100">
                    {recipient.firstName} {recipient.lastName}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-dark-500">
                    <span>{country?.name || recipient.country}</span>
                    <span>•</span>
                    <DeliveryIcon className="w-4 h-4" />
                    <span>{deliveryMethodLabels[recipient.deliveryMethod]}</span>
                  </div>
                </div>
                <Link
                  to="/send"
                  state={{ recipientId: recipient.id }}
                  className="btn-ghost text-primary-400 hover:text-primary-300"
                >
                  <Send className="w-5 h-5" />
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setActiveMenu(activeMenu === recipient.id ? null : recipient.id)}
                    className="btn-ghost p-2"
                  >
                    <MoreVertical className="w-5 h-5 text-dark-500" />
                  </button>
                  {activeMenu === recipient.id && (
                    <div className="absolute right-0 top-full mt-1 w-40 bg-dark-800 rounded-xl shadow-xl border border-dark-700 overflow-hidden z-10">
                      <button
                        onClick={() => openEditModal(recipient)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-dark-700 text-dark-200"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(recipient.id)}
                        disabled={deletingId === recipient.id}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-dark-700 text-red-400"
                      >
                        {deletingId === recipient.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-dark-800">
              <h2 className="text-lg font-display font-semibold text-white">
                {editingRecipient ? 'Edit Recipient' : 'Add Recipient'}
              </h2>
              <button onClick={closeModal} className="btn-ghost p-2">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    First name
                  </label>
                  <input
                    {...register('firstName', { required: 'Required' })}
                    className={`input ${errors.firstName ? 'input-error' : ''}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Last name
                  </label>
                  <input
                    {...register('lastName', { required: 'Required' })}
                    className={`input ${errors.lastName ? 'input-error' : ''}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Country
                </label>
                <select
                  {...register('country', { required: 'Required' })}
                  className={`input ${errors.country ? 'input-error' : ''}`}
                  onChange={(e) => {
                    setValue('country', e.target.value);
                    const c = countries.find((c) => c.code === e.target.value);
                    if (c?.deliveryMethods[0]) {
                      setValue('deliveryMethod', c.deliveryMethods[0]);
                    }
                  }}
                >
                  <option value="">Select country</option>
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {countryData && (
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Delivery method
                  </label>
                  <select
                    {...register('deliveryMethod', { required: 'Required' })}
                    className={`input ${errors.deliveryMethod ? 'input-error' : ''}`}
                  >
                    {countryData.deliveryMethods.map((m) => (
                      <option key={m} value={m}>
                        {deliveryMethodLabels[m]}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedDeliveryMethod === 'bank_deposit' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">
                      Bank name
                    </label>
                    <input
                      {...register('bankName', { required: 'Required' })}
                      className={`input ${errors.bankName ? 'input-error' : ''}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">
                      Account number
                    </label>
                    <input
                      {...register('accountNumber', { required: 'Required' })}
                      className={`input ${errors.accountNumber ? 'input-error' : ''}`}
                    />
                  </div>
                </>
              )}

              {selectedDeliveryMethod === 'mobile_wallet' && (
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Mobile number
                  </label>
                  <input
                    {...register('mobileNumber', { required: 'Required' })}
                    className={`input ${errors.mobileNumber ? 'input-error' : ''}`}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Phone <span className="text-dark-500">(optional)</span>
                </label>
                <input {...register('phone')} className="input" />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-secondary flex-1 py-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex-1 py-3 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : editingRecipient ? (
                    'Save Changes'
                  ) : (
                    'Add Recipient'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
