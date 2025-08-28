import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft, Copy, Clock, CheckCircle, XCircle, AlertCircle,
  Loader2, Building2, Smartphone, Banknote, Send, User,
  ArrowRight, ExternalLink, Share2
} from 'lucide-react';
import { format } from 'date-fns';
import { transferAPI } from '../services/api';

const statusConfig = {
  pending: {
    label: 'Pending',
    icon: Clock,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    description: 'Transfer is being processed',
  },
  processing: {
    label: 'Processing',
    icon: Loader2,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    description: 'Your money is on its way',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    description: 'Transfer delivered successfully',
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
    description: 'Transfer was cancelled',
  },
};

const deliveryMethodLabels = {
  bank_deposit: 'Bank Deposit',
  mobile_wallet: 'Mobile Wallet',
  cash_pickup: 'Cash Pickup',
};

const deliveryMethodIcons = {
  bank_deposit: Building2,
  mobile_wallet: Smartphone,
  cash_pickup: Banknote,
};

export default function TransferDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transfer, setTransfer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    async function fetchTransfer() {
      try {
        const response = await transferAPI.getById(id);
        setTransfer(response.data);
      } catch (error) {
        toast.error('Transfer not found');
        navigate('/transfers');
      } finally {
        setLoading(false);
      }
    }
    fetchTransfer();
  }, [id, navigate]);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this transfer?')) {
      return;
    }
    setCancelling(true);
    try {
      await transferAPI.cancel(id);
      setTransfer((t) => ({ ...t, status: 'cancelled' }));
      toast.success('Transfer cancelled');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Cannot cancel transfer');
    } finally {
      setCancelling(false);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/track/${transfer.referenceNumber}`;
    if (navigator.share) {
      navigator.share({
        title: 'Track Transfer',
        text: `Track your transfer: ${transfer.referenceNumber}`,
        url,
      });
    } else {
      handleCopy(url);
      toast.success('Link copied to clipboard');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-dark-500" />
      </div>
    );
  }

  if (!transfer) return null;

  const status = statusConfig[transfer.status];
  const StatusIcon = status.icon;
  const DeliveryIcon = deliveryMethodIcons[transfer.deliveryMethod];

  return (
    <div className="max-w-2xl mx-auto animate-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/transfers')} className="btn-ghost p-2">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-display font-bold text-white">
            Transfer Details
          </h1>
          <p className="text-dark-400 mt-1">
            Reference: {transfer.referenceNumber}
          </p>
        </div>
        <button onClick={handleShare} className="btn-secondary">
          <Share2 className="w-5 h-5" />
          Share
        </button>
      </div>

      {/* Status Card */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl ${status.bgColor} flex items-center justify-center`}>
            <StatusIcon className={`w-8 h-8 ${status.color} ${transfer.status === 'processing' ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <p className={`text-lg font-semibold ${status.color}`}>{status.label}</p>
            <p className="text-dark-400">{status.description}</p>
          </div>
        </div>

        {/* Timeline */}
        {transfer.statusHistory && transfer.statusHistory.length > 0 && (
          <div className="mt-6 border-t border-dark-800 pt-6">
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
                      {entry.notes && (
                        <p className="text-sm text-dark-400 mt-1">{entry.notes}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Amount Details */}
      <div className="card p-6 mb-6">
        <h3 className="text-sm font-medium text-dark-400 mb-4">Transfer Amount</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-dark-500">You sent</p>
            <p className="text-2xl font-display font-bold text-white">
              ${transfer.sendAmount.toFixed(2)} <span className="text-dark-500 text-base">USD</span>
            </p>
          </div>
          <ArrowRight className="w-6 h-6 text-primary-500" />
          <div className="text-right">
            <p className="text-sm text-dark-500">They receive</p>
            <p className="text-2xl font-display font-bold text-primary-400">
              {transfer.receiveAmount.toLocaleString()}{' '}
              <span className="text-primary-500/60 text-base">{transfer.receiveCurrency}</span>
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-dark-800 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-dark-500">Exchange rate</span>
            <span className="text-dark-200">
              1 USD = {transfer.exchangeRate.toFixed(4)} {transfer.receiveCurrency}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-dark-500">Fee</span>
            <span className="text-dark-200">${transfer.fee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-dark-500">Total paid</span>
            <span className="text-white font-medium">
              ${(transfer.sendAmount + transfer.fee).toFixed(2)} USD
            </span>
          </div>
        </div>
      </div>

      {/* Recipient Details */}
      <div className="card p-6 mb-6">
        <h3 className="text-sm font-medium text-dark-400 mb-4">Recipient</h3>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-dark-800 flex items-center justify-center text-2xl">
            {transfer.recipient.flag || '🌍'}
          </div>
          <div className="flex-1">
            <p className="text-lg font-medium text-white">
              {transfer.recipient.firstName} {transfer.recipient.lastName}
            </p>
            <div className="flex items-center gap-2 text-sm text-dark-500">
              <DeliveryIcon className="w-4 h-4" />
              <span>{deliveryMethodLabels[transfer.deliveryMethod]}</span>
              <span>•</span>
              <span>{transfer.recipient.country}</span>
            </div>
          </div>
        </div>

        {transfer.recipient.bankName && (
          <div className="mt-4 pt-4 border-t border-dark-800">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-dark-500">Bank</span>
              <span className="text-dark-200">{transfer.recipient.bankName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-dark-500">Account</span>
              <span className="text-dark-200 font-mono">
                •••• {transfer.recipient.accountNumber?.slice(-4)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Reference & Actions */}
      <div className="card p-6 mb-6">
        <h3 className="text-sm font-medium text-dark-400 mb-4">Reference</h3>
        <div className="flex items-center gap-3 p-3 bg-dark-800 rounded-xl">
          <span className="flex-1 font-mono text-primary-400">
            {transfer.referenceNumber}
          </span>
          <button
            onClick={() => handleCopy(transfer.referenceNumber)}
            className="btn-ghost p-2"
          >
            <Copy className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-dark-500 mt-2">
          Created on {format(new Date(transfer.createdAt), 'MMMM d, yyyy \'at\' h:mm a')}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        {transfer.status === 'pending' && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="btn-secondary flex-1 py-3 text-red-400 hover:text-red-300"
          >
            {cancelling ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <XCircle className="w-5 h-5" />
                Cancel Transfer
              </>
            )}
          </button>
        )}
        <Link to="/send" className="btn-primary flex-1 py-3">
          <Send className="w-5 h-5" />
          Send Again
        </Link>
      </div>
    </div>
  );
}
