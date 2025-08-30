import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  Search, Clock, CheckCircle, XCircle, AlertCircle,
  Loader2, ArrowRight, Globe, Shield
} from 'lucide-react';
import { format } from 'date-fns';
import { transferAPI } from '../services/api';

const statusConfig = {
  pending: {
    label: 'Pending',
    icon: Clock,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    description: 'Your transfer is being processed',
  },
  processing: {
    label: 'In Transit',
    icon: Loader2,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    description: 'Money is on its way to the recipient',
  },
  completed: {
    label: 'Delivered',
    icon: CheckCircle,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    description: 'Transfer has been delivered successfully',
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    description: 'Transfer could not be completed',
  },
  cancelled: {
    label: 'Cancelled',
    icon: AlertCircle,
    color: 'text-dark-400',
    bgColor: 'bg-dark-500/20',
    description: 'This transfer was cancelled',
  },
};

export default function TrackTransfer() {
  const { reference } = useParams();
  const [transfer, setTransfer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  const { register, handleSubmit, setValue } = useForm({
    defaultValues: { reference: reference || '' },
  });

  useEffect(() => {
    if (reference) {
      setValue('reference', reference);
      searchTransfer(reference);
    }
  }, [reference, setValue]);

  const searchTransfer = async (ref) => {
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const response = await transferAPI.track(ref);
      setTransfer(response.data);
    } catch (err) {
      setError('Transfer not found. Please check the reference number.');
      setTransfer(null);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (data) => {
    if (data.reference.trim()) {
      searchTransfer(data.reference.trim());
    }
  };

  const status = transfer ? statusConfig[transfer.status] : null;
  const StatusIcon = status?.icon;

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header */}
      <header className="border-b border-dark-800 bg-dark-900/50 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-display font-bold text-white">RemitFlow</span>
          </Link>
          <Link to="/login" className="btn-secondary text-sm py-2">
            Sign In
          </Link>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-white">Track Your Transfer</h1>
          <p className="text-dark-400 mt-2">
            Enter your reference number to see the status of your transfer
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="mb-8">
          <div className="relative">
            <input
              {...register('reference')}
              className="input pl-14 pr-32 py-5 text-lg font-mono"
              placeholder="RF1234567890"
            />
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-dark-500" />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary py-3 px-6"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Track'
              )}
            </button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="card p-6 text-center mb-8 border-red-500/30 bg-red-500/5">
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Result */}
        {transfer && status && (
          <div className="animate-in">
            {/* Status Card */}
            <div className="card p-8 mb-6 text-center">
              <div className={`w-20 h-20 rounded-2xl ${status.bgColor} flex items-center justify-center mx-auto mb-4`}>
                <StatusIcon className={`w-10 h-10 ${status.color} ${transfer.status === 'processing' ? 'animate-spin' : ''}`} />
              </div>
              <h2 className={`text-2xl font-display font-bold ${status.color}`}>
                {status.label}
              </h2>
              <p className="text-dark-400 mt-2">{status.description}</p>
            </div>

            {/* Transfer Info */}
            <div className="card p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-dark-500">Amount Sent</p>
                  <p className="text-xl font-display font-bold text-white">
                    ${transfer.sendAmount.toFixed(2)} USD
                  </p>
                </div>
                <ArrowRight className="w-6 h-6 text-primary-500" />
                <div className="text-right">
                  <p className="text-sm text-dark-500">Amount Received</p>
                  <p className="text-xl font-display font-bold text-primary-400">
                    {transfer.receiveAmount.toLocaleString()} {transfer.receiveCurrency}
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-dark-800">
                <div className="flex justify-between text-sm">
                  <span className="text-dark-500">Reference</span>
                  <span className="font-mono text-primary-400">{transfer.referenceNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-dark-500">Recipient</span>
                  <span className="text-dark-200">
                    {transfer.recipient.firstName} {transfer.recipient.lastName}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-dark-500">Destination</span>
                  <span className="text-dark-200">{transfer.recipient.country}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-dark-500">Date</span>
                  <span className="text-dark-200">
                    {format(new Date(transfer.createdAt), 'MMMM d, yyyy')}
                  </span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            {transfer.statusHistory && transfer.statusHistory.length > 0 && (
              <div className="card p-6">
                <h3 className="text-sm font-medium text-dark-300 mb-4">Status History</h3>
                <div className="space-y-4">
                  {transfer.statusHistory.map((entry, i) => {
                    const entryStatus = statusConfig[entry.status];
                    const EntryIcon = entryStatus.icon;
                    return (
                      <div key={i} className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg ${entryStatus.bgColor} flex items-center justify-center flex-shrink-0`}>
                          <EntryIcon className={`w-4 h-4 ${entryStatus.color}`} />
                        </div>
                        <div>
                          <p className="text-dark-200 font-medium">{entryStatus.label}</p>
                          <p className="text-sm text-dark-500">
                            {format(new Date(entry.timestamp), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!searched && !loading && !transfer && (
          <div className="card p-12 text-center">
            <Search className="w-16 h-16 text-dark-700 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-dark-200 mb-2">
              Enter your reference number
            </h3>
            <p className="text-dark-500">
              You can find your reference number in your confirmation email
            </p>
          </div>
        )}

        {/* Security Note */}
        <div className="flex items-center gap-3 mt-8 p-4 bg-dark-900 rounded-xl">
          <Shield className="w-6 h-6 text-primary-500 flex-shrink-0" />
          <p className="text-sm text-dark-400">
            Your financial information is protected. We only display limited details for security.
          </p>
        </div>
      </main>
    </div>
  );
}
