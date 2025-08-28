import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import {
  ArrowRight, ArrowLeft, Check, Loader2, DollarSign,
  User, CreditCard, Building2, Smartphone, Banknote,
  Globe, AlertCircle, ChevronDown
} from 'lucide-react';
import { useCountries, useRecipients, useTransferQuote } from '../hooks/useData';
import { transferAPI, recipientAPI } from '../services/api';

const STEPS = ['amount', 'recipient', 'review', 'complete'];

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

export default function SendMoney() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [deliveryMethod, setDeliveryMethod] = useState('bank_deposit');
  const [sendAmount, setSendAmount] = useState('');
  const [creatingRecipient, setCreatingRecipient] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [transferResult, setTransferResult] = useState(null);

  const { countries, loading: countriesLoading } = useCountries();
  const { recipients, loading: recipientsLoading, refetch: refetchRecipients } = useRecipients();
  const { quote, loading: quoteLoading, error: quoteError } = useTransferQuote(
    selectedCountry?.code,
    parseFloat(sendAmount) || 0,
    deliveryMethod
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset: resetRecipientForm,
  } = useForm();

  // Filter recipients by selected country
  const countryRecipients = recipients.filter(
    (r) => r.country === selectedCountry?.code
  );

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setDeliveryMethod(country.deliveryMethods[0] || 'bank_deposit');
    setSelectedRecipient(null);
  };

  const handleAmountContinue = () => {
    if (!selectedCountry) {
      toast.error('Please select a destination country');
      return;
    }
    if (!sendAmount || parseFloat(sendAmount) < 1) {
      toast.error('Please enter an amount of at least $1');
      return;
    }
    if (quoteError) {
      toast.error('Unable to get exchange rate. Please try again.');
      return;
    }
    setStep(1);
  };

  const handleRecipientSelect = (recipient) => {
    setSelectedRecipient(recipient);
    setStep(2);
  };

  const handleCreateRecipient = async (data) => {
    setCreatingRecipient(true);
    try {
      const response = await recipientAPI.create({
        ...data,
        country: selectedCountry.code,
        deliveryMethod,
      });
      await refetchRecipients();
      setSelectedRecipient(response.data);
      resetRecipientForm();
      setStep(2);
      toast.success('Recipient added successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add recipient');
    } finally {
      setCreatingRecipient(false);
    }
  };

  const handleSubmitTransfer = async () => {
    setSubmitting(true);
    try {
      const response = await transferAPI.create({
        recipientId: selectedRecipient.id,
        sendAmount: parseFloat(sendAmount),
        deliveryMethod,
        paymentMethod: 'bank_account',
      });
      setTransferResult(response.data);
      setStep(3);
      toast.success('Transfer initiated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create transfer');
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div className="max-w-2xl mx-auto animate-in">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all ${
                  i < step
                    ? 'bg-primary-500 text-white'
                    : i === step
                    ? 'bg-primary-500/20 text-primary-400 ring-2 ring-primary-500'
                    : 'bg-dark-800 text-dark-500'
                }`}
              >
                {i < step ? <Check className="w-5 h-5" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`w-16 sm:w-24 h-1 mx-2 rounded ${
                    i < step ? 'bg-primary-500' : 'bg-dark-800'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-dark-500">
          <span>Amount</span>
          <span>Recipient</span>
          <span>Review</span>
          <span>Complete</span>
        </div>
      </div>

      {/* Step 1: Amount */}
      {step === 0 && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-white">Send Money</h1>
            <p className="text-dark-400 mt-1">Choose destination and amount</p>
          </div>

          {/* Country Selection */}
          <div className="card p-5 space-y-4">
            <label className="block text-sm font-medium text-dark-300">
              Send to
            </label>
            {countriesLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-dark-500" />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                {countries.map((country) => (
                  <button
                    key={country.code}
                    onClick={() => handleCountrySelect(country)}
                    className={`p-3 rounded-xl text-left transition-all ${
                      selectedCountry?.code === country.code
                        ? 'bg-primary-500/20 ring-2 ring-primary-500'
                        : 'bg-dark-800 hover:bg-dark-700'
                    }`}
                  >
                    <span className="text-2xl">{country.flag}</span>
                    <p className="text-sm font-medium text-dark-100 mt-1">
                      {country.name}
                    </p>
                    <p className="text-xs text-dark-500">{country.currency}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Delivery Method */}
          {selectedCountry && (
            <div className="card p-5 space-y-4">
              <label className="block text-sm font-medium text-dark-300">
                Delivery method
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedCountry.deliveryMethods.map((method) => {
                  const Icon = deliveryMethodIcons[method];
                  return (
                    <button
                      key={method}
                      onClick={() => setDeliveryMethod(method)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all ${
                        deliveryMethod === method
                          ? 'bg-primary-500/20 ring-2 ring-primary-500 text-primary-400'
                          : 'bg-dark-800 hover:bg-dark-700 text-dark-300'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">
                        {deliveryMethodLabels[method]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Amount Input */}
          {selectedCountry && (
            <div className="card p-5 space-y-4">
              <label className="block text-sm font-medium text-dark-300">
                You send
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 text-xl">
                  $
                </span>
                <input
                  type="number"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  className="input pl-10 text-2xl font-display font-bold"
                  placeholder="0.00"
                  min="1"
                  step="0.01"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400">
                  USD
                </span>
              </div>

              {/* Quote Display */}
              {sendAmount && parseFloat(sendAmount) > 0 && (
                <div className="mt-4 space-y-3">
                  {quoteLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-dark-500" />
                    </div>
                  ) : quoteError ? (
                    <div className="flex items-center gap-2 text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      Unable to get quote
                    </div>
                  ) : quote ? (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-dark-400">Exchange rate</span>
                        <span className="text-dark-200">
                          1 USD = {quote.exchangeRate.toFixed(4)} {selectedCountry.currency}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-dark-400">Fee</span>
                        <span className="text-dark-200">${quote.fee.toFixed(2)}</span>
                      </div>
                      <div className="border-t border-dark-700 pt-3 flex justify-between">
                        <span className="text-dark-300">They receive</span>
                        <span className="text-xl font-display font-bold text-primary-400">
                          {quote.receiveAmount.toLocaleString()} {selectedCountry.currency}
                        </span>
                      </div>
                    </>
                  ) : null}
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleAmountContinue}
            disabled={!selectedCountry || !sendAmount || quoteLoading}
            className="btn-primary w-full py-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Step 2: Recipient */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <button onClick={goBack} className="btn-ghost p-2">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-display font-bold text-white">
                Select Recipient
              </h1>
              <p className="text-dark-400 mt-1">
                Choose or add a recipient in {selectedCountry?.name}
              </p>
            </div>
          </div>

          {/* Existing Recipients */}
          {countryRecipients.length > 0 && (
            <div className="card divide-y divide-dark-800">
              {countryRecipients.map((recipient) => (
                <button
                  key={recipient.id}
                  onClick={() => handleRecipientSelect(recipient)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-dark-800/30 transition-colors text-left"
                >
                  <div className="w-12 h-12 rounded-full bg-dark-800 flex items-center justify-center">
                    <User className="w-6 h-6 text-dark-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-dark-100">
                      {recipient.firstName} {recipient.lastName}
                    </p>
                    <p className="text-sm text-dark-500">
                      {deliveryMethodLabels[recipient.deliveryMethod]}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-dark-600" />
                </button>
              ))}
            </div>
          )}

          {/* Add New Recipient Form */}
          <div className="card p-5">
            <h3 className="font-medium text-dark-200 mb-4">
              {countryRecipients.length > 0 ? 'Or add a new recipient' : 'Add recipient details'}
            </h3>
            <form onSubmit={handleSubmit(handleCreateRecipient)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    First name
                  </label>
                  <input
                    {...register('firstName', { required: 'Required' })}
                    className={`input ${errors.firstName ? 'input-error' : ''}`}
                    placeholder="Maria"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Last name
                  </label>
                  <input
                    {...register('lastName', { required: 'Required' })}
                    className={`input ${errors.lastName ? 'input-error' : ''}`}
                    placeholder="Garcia"
                  />
                </div>
              </div>

              {deliveryMethod === 'bank_deposit' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">
                      Bank name
                    </label>
                    <input
                      {...register('bankName', { required: 'Required for bank deposit' })}
                      className={`input ${errors.bankName ? 'input-error' : ''}`}
                      placeholder="Banco Nacional"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">
                      Account number
                    </label>
                    <input
                      {...register('accountNumber', { required: 'Required for bank deposit' })}
                      className={`input ${errors.accountNumber ? 'input-error' : ''}`}
                      placeholder="1234567890"
                    />
                  </div>
                </>
              )}

              {deliveryMethod === 'mobile_wallet' && (
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Mobile number
                  </label>
                  <input
                    {...register('mobileNumber', { required: 'Required for mobile wallet' })}
                    className={`input ${errors.mobileNumber ? 'input-error' : ''}`}
                    placeholder="+52 555 123 4567"
                  />
                </div>
              )}

              {deliveryMethod === 'cash_pickup' && (
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Phone number (for notification)
                  </label>
                  <input
                    {...register('phone')}
                    className="input"
                    placeholder="+52 555 123 4567"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={creatingRecipient}
                className="btn-primary w-full py-3 disabled:opacity-50"
              >
                {creatingRecipient ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    Add & Continue
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 2 && selectedRecipient && quote && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <button onClick={goBack} className="btn-ghost p-2">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-display font-bold text-white">
                Review Transfer
              </h1>
              <p className="text-dark-400 mt-1">Confirm the details before sending</p>
            </div>
          </div>

          {/* Transfer Summary */}
          <div className="card p-6 space-y-5">
            {/* Amount */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-500">You send</p>
                <p className="text-2xl font-display font-bold text-white">
                  ${parseFloat(sendAmount).toFixed(2)} USD
                </p>
              </div>
              <ArrowRight className="w-6 h-6 text-primary-500" />
              <div className="text-right">
                <p className="text-sm text-dark-500">They receive</p>
                <p className="text-2xl font-display font-bold text-primary-400">
                  {quote.receiveAmount.toLocaleString()} {selectedCountry.currency}
                </p>
              </div>
            </div>

            <div className="border-t border-dark-800 pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-dark-400">Exchange rate</span>
                <span className="text-dark-200">
                  1 USD = {quote.exchangeRate.toFixed(4)} {selectedCountry.currency}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-dark-400">Transfer fee</span>
                <span className="text-dark-200">${quote.fee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-dark-400">Total to pay</span>
                <span className="font-medium text-white">
                  ${(parseFloat(sendAmount) + quote.fee).toFixed(2)} USD
                </span>
              </div>
            </div>
          </div>

          {/* Recipient Details */}
          <div className="card p-5">
            <h3 className="text-sm font-medium text-dark-400 mb-3">Recipient</h3>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-dark-800 flex items-center justify-center text-2xl">
                {selectedCountry.flag}
              </div>
              <div>
                <p className="font-medium text-white">
                  {selectedRecipient.firstName} {selectedRecipient.lastName}
                </p>
                <p className="text-sm text-dark-400">
                  {selectedCountry.name} • {deliveryMethodLabels[deliveryMethod]}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="card p-5">
            <h3 className="text-sm font-medium text-dark-400 mb-3">Pay with</h3>
            <div className="flex items-center gap-4 p-3 bg-dark-800 rounded-xl">
              <Building2 className="w-6 h-6 text-dark-400" />
              <div>
                <p className="font-medium text-white">Bank Account</p>
                <p className="text-sm text-dark-500">ACH Transfer</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmitTransfer}
            disabled={submitting}
            className="btn-primary w-full py-4 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Confirm & Send ${(parseFloat(sendAmount) + quote.fee).toFixed(2)}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      )}

      {/* Step 4: Complete */}
      {step === 3 && transferResult && (
        <div className="text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto">
            <Check className="w-10 h-10 text-primary-400" />
          </div>

          <div>
            <h1 className="text-2xl font-display font-bold text-white">
              Transfer Initiated!
            </h1>
            <p className="text-dark-400 mt-2">
              Your money is on its way to {selectedRecipient.firstName}
            </p>
          </div>

          <div className="card p-5 text-left space-y-4">
            <div className="flex justify-between">
              <span className="text-dark-400">Reference number</span>
              <span className="font-mono text-primary-400">
                {transferResult.referenceNumber}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-400">Amount sent</span>
              <span className="text-white">${transferResult.sendAmount.toFixed(2)} USD</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-400">Amount received</span>
              <span className="text-primary-400">
                {transferResult.receiveAmount.toLocaleString()} {selectedCountry.currency}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-400">Estimated delivery</span>
              <span className="text-white">Within 24 hours</span>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-secondary flex-1 py-3"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => navigate(`/transfers/${transferResult.id}`)}
              className="btn-primary flex-1 py-3"
            >
              Track Transfer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
