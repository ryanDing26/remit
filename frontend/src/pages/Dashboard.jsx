import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTransfers, useRecipients } from '../hooks/useData';
import { userAPI } from '../services/api';
import {
  Send, Users, TrendingUp, Clock, ArrowUpRight,
  ChevronRight, AlertCircle, CheckCircle, Loader2
} from 'lucide-react';
import { format } from 'date-fns';

const statusColors = {
  pending: 'status-pending',
  processing: 'status-processing',
  completed: 'status-completed',
  failed: 'status-failed',
  cancelled: 'status-cancelled',
};

export default function Dashboard() {
  const { user } = useAuth();
  const { transfers, loading: transfersLoading } = useTransfers({ limit: 5 });
  const { recipients, loading: recipientsLoading } = useRecipients();
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await userAPI.getStats();
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setStatsLoading(false);
      }
    }
    fetchStats();
  }, []);

  const statCards = [
    {
      label: 'Total Sent',
      value: stats ? `$${stats.summary.totalSent.toLocaleString()}` : '$0',
      icon: TrendingUp,
      color: 'text-primary-400',
      bgColor: 'bg-primary-500/10',
    },
    {
      label: 'Transfers',
      value: stats?.summary.totalTransfers || 0,
      icon: Send,
      color: 'text-accent-400',
      bgColor: 'bg-accent-500/10',
    },
    {
      label: 'Recipients',
      value: stats?.summary.uniqueRecipients || 0,
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Fees Paid',
      value: stats ? `$${stats.summary.totalFees.toFixed(2)}` : '$0',
      icon: Clock,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">
            Welcome back, {user?.firstName}! 👋
          </h1>
          <p className="text-dark-400 mt-1">Here's what's happening with your transfers.</p>
        </div>
        <Link to="/send" className="btn-primary">
          <Send className="w-5 h-5" />
          Send Money
        </Link>
      </div>

      {/* KYC Warning */}
      {user?.kycStatus !== 'verified' && (
        <div className="card p-4 flex items-start gap-4 border-amber-500/30 bg-amber-500/5">
          <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-amber-400">Complete your verification</h3>
            <p className="text-sm text-dark-400 mt-1">
              Verify your identity to unlock all features and higher transfer limits.
            </p>
          </div>
          <Link to="/settings" className="btn-secondary text-sm py-2">
            Verify Now
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bgColor }) => (
          <div key={label} className="card p-5">
            <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-sm text-dark-500">{label}</p>
            <p className="text-2xl font-display font-bold text-white mt-1">
              {statsLoading ? (
                <span className="inline-block w-16 h-8 bg-dark-700 rounded animate-pulse" />
              ) : (
                value
              )}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Link to="/send" className="card-hover p-5 group">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center">
              <Send className="w-6 h-6 text-primary-400" />
            </div>
            <ChevronRight className="w-5 h-5 text-dark-600 group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-lg font-medium text-white mt-4">Send Money</h3>
          <p className="text-sm text-dark-500 mt-1">Transfer to any recipient</p>
        </Link>

        <Link to="/recipients" className="card-hover p-5 group">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-xl bg-accent-500/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-accent-400" />
            </div>
            <ChevronRight className="w-5 h-5 text-dark-600 group-hover:text-accent-400 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-lg font-medium text-white mt-4">Recipients</h3>
          <p className="text-sm text-dark-500 mt-1">
            {recipientsLoading ? 'Loading...' : `${recipients.length} saved`}
          </p>
        </Link>

        <Link to="/transfers" className="card-hover p-5 group">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-400" />
            </div>
            <ChevronRight className="w-5 h-5 text-dark-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-lg font-medium text-white mt-4">History</h3>
          <p className="text-sm text-dark-500 mt-1">View all transfers</p>
        </Link>
      </div>

      {/* Recent Transfers */}
      <div className="card">
        <div className="flex items-center justify-between p-5 border-b border-dark-800">
          <h2 className="text-lg font-display font-semibold text-white">Recent Transfers</h2>
          <Link to="/transfers" className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1">
            View all
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {transfersLoading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-dark-500" />
          </div>
        ) : transfers.length === 0 ? (
          <div className="p-8 text-center">
            <Send className="w-12 h-12 text-dark-700 mx-auto mb-3" />
            <p className="text-dark-400">No transfers yet</p>
            <Link to="/send" className="btn-primary mt-4">
              Send Your First Transfer
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-dark-800">
            {transfers.map((transfer) => (
              <Link
                key={transfer.id}
                to={`/transfers/${transfer.id}`}
                className="flex items-center gap-4 p-4 hover:bg-dark-800/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-dark-800 flex items-center justify-center text-lg">
                  {transfer.recipient.flag}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-dark-100 truncate">
                    {transfer.recipient.name}
                  </p>
                  <p className="text-sm text-dark-500">
                    {format(new Date(transfer.createdAt), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-dark-100">
                    ${transfer.sendAmount.toFixed(2)}
                  </p>
                  <span className={statusColors[transfer.status]}>
                    {transfer.status}
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-dark-600" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
