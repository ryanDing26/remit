import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Filter, ChevronRight, Loader2, Send, Calendar,
  ArrowUpRight, ArrowDownRight, Clock, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { useTransfers } from '../hooks/useData';

const statusConfig = {
  pending: {
    label: 'Pending',
    icon: Clock,
    className: 'status-pending',
    bgClass: 'bg-amber-500/10',
  },
  processing: {
    label: 'Processing',
    icon: Loader2,
    className: 'status-processing',
    bgClass: 'bg-blue-500/10',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    className: 'status-completed',
    bgClass: 'bg-green-500/10',
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    className: 'status-failed',
    bgClass: 'bg-red-500/10',
  },
  cancelled: {
    label: 'Cancelled',
    icon: AlertCircle,
    className: 'status-cancelled',
    bgClass: 'bg-dark-500/10',
  },
};

export default function TransferHistory() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const { transfers, loading, pagination } = useTransfers({
    page,
    limit: 10,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    search: searchQuery || undefined,
  });

  const filteredTransfers = transfers.filter((t) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const name = `${t.recipient.firstName} ${t.recipient.lastName}`.toLowerCase();
      const ref = t.referenceNumber.toLowerCase();
      if (!name.includes(query) && !ref.includes(query)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Transfer History</h1>
          <p className="text-dark-400 mt-1">View and track all your transfers</p>
        </div>
        <Link to="/send" className="btn-primary">
          <Send className="w-5 h-5" />
          New Transfer
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-12"
            placeholder="Search by name or reference..."
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-secondary ${showFilters ? 'ring-2 ring-primary-500' : ''}`}
        >
          <Filter className="w-5 h-5" />
          Filters
        </button>
      </div>

      {/* Filter Options */}
      {showFilters && (
        <div className="card p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                statusFilter === 'all'
                  ? 'bg-primary-500 text-white'
                  : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
              }`}
            >
              All
            </button>
            {Object.entries(statusConfig).map(([key, { label }]) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  statusFilter === key
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Transfers List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-dark-500" />
        </div>
      ) : filteredTransfers.length === 0 ? (
        <div className="card p-12 text-center">
          <Send className="w-16 h-16 text-dark-700 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-dark-200 mb-2">
            {searchQuery || statusFilter !== 'all'
              ? 'No transfers found'
              : 'No transfers yet'}
          </h3>
          <p className="text-dark-500 mb-6">
            {searchQuery || statusFilter !== 'all'
              ? 'Try different search terms or filters'
              : 'Send your first transfer to get started'}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <Link to="/send" className="btn-primary">
              <Send className="w-5 h-5" />
              Send Money
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="card divide-y divide-dark-800">
            {filteredTransfers.map((transfer) => {
              const status = statusConfig[transfer.status];
              const StatusIcon = status.icon;
              return (
                <Link
                  key={transfer.id}
                  to={`/transfers/${transfer.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-dark-800/30 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-dark-800 flex items-center justify-center text-2xl">
                    {transfer.recipient.flag}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-dark-100 truncate">
                        {transfer.recipient.firstName} {transfer.recipient.lastName}
                      </p>
                      <span className={`${status.className} text-xs`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-dark-500">
                      <Calendar className="w-4 h-4" />
                      <span>{format(new Date(transfer.createdAt), 'MMM d, yyyy')}</span>
                      <span>•</span>
                      <span className="font-mono text-xs">{transfer.referenceNumber}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-dark-100">
                      <ArrowUpRight className="w-4 h-4 text-red-400" />
                      <span className="font-medium">
                        ${transfer.sendAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-primary-400 text-sm">
                      <ArrowDownRight className="w-4 h-4" />
                      <span>
                        {transfer.receiveAmount.toLocaleString()} {transfer.receiveCurrency}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-dark-600" />
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-dark-500">
                Showing {(page - 1) * 10 + 1} to{' '}
                {Math.min(page * 10, pagination.total)} of {pagination.total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-secondary py-2 px-4 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="btn-secondary py-2 px-4 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
