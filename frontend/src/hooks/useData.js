import { useState, useEffect, useCallback } from 'react';
import { exchangeAPI, countryAPI, transferAPI, recipientAPI } from '../services/api';

// Exchange rate hook
export function useExchangeRate(from = 'USD', to) {
  const [rate, setRate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRate = useCallback(async () => {
    if (!to) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await exchangeAPI.getRate(from, to);
      setRate(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch rate');
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    fetchRate();
  }, [fetchRate]);

  return { rate, loading, error, refresh: fetchRate };
}

// Quote calculation hook
export function useTransferQuote() {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getQuote = useCallback(async (sendAmount, receiveCurrency) => {
    if (!sendAmount || sendAmount <= 0 || !receiveCurrency) {
      setQuote(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await transferAPI.getQuote({
        sendAmount,
        receiveCurrency,
      });
      setQuote(response.data.quote);
      return response.data.quote;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to get quote');
      setQuote(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearQuote = () => setQuote(null);

  return { quote, loading, error, getQuote, clearQuote };
}

// Countries hook
export function useCountries() {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchCountries() {
      try {
        const response = await countryAPI.getAll();
        setCountries(response.data.countries);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch countries');
      } finally {
        setLoading(false);
      }
    }

    fetchCountries();
  }, []);

  return { countries, loading, error };
}

// Recipients hook
export function useRecipients() {
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRecipients = useCallback(async () => {
    setLoading(true);
    try {
      const response = await recipientAPI.getAll();
      setRecipients(response.data.recipients);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch recipients');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecipients();
  }, [fetchRecipients]);

  const addRecipient = async (data) => {
    const response = await recipientAPI.create(data);
    await fetchRecipients();
    return response.data.recipient;
  };

  const removeRecipient = async (id) => {
    await recipientAPI.delete(id);
    setRecipients(prev => prev.filter(r => r.id !== id));
  };

  return { recipients, loading, error, addRecipient, removeRecipient, refresh: fetchRecipients };
}

// Transfers hook with pagination
export function useTransfers(initialParams = {}) {
  const [transfers, setTransfers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTransfers = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const response = await transferAPI.getAll({ ...initialParams, ...params });
      setTransfers(response.data.transfers);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch transfers');
    } finally {
      setLoading(false);
    }
  }, [initialParams]);

  useEffect(() => {
    fetchTransfers();
  }, [fetchTransfers]);

  return { transfers, pagination, loading, error, refresh: fetchTransfers };
}
