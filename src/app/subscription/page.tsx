'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Subscription() {
  const [session, setSession] = useState<any>(null);
  const [credits, setCredits] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [allSubscriptions, setAllSubscriptions] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshData = () => {
    setRefreshKey(prev => prev + 1);
  };

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        setSession(data);
        if (data?.user?.id) {
          Promise.all([
            fetch('/api/user/info').then(res => res.json()),
            fetch('/api/user/subscriptions').then(res => res.json()),
            fetch('/api/user/transactions').then(res => res.json())
          ]).then(([userData, subscriptionsData, transactionsData]) => {
            setCredits(userData.credits);
            setSubscription(userData.subscription);
            setAllSubscriptions(subscriptionsData.subscriptions || []);
            setTransactions(transactionsData.transactions || []);
            setLoading(false);
          });
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, [refreshKey]);

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel your subscription?')) {
      alert('Subscription cancellation coming soon. Please contact support.');
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPlanName = (plan: string) => {
    if (plan === 'yearly') return 'Pro Yearly ($69/年)';
    if (plan === 'monthly') return 'Pro Monthly ($10/月)';
    return plan;
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'purchase': return '购买';
      case 'usage': return '使用';
      case 'bonus': return '奖励';
      case 'refund': return '退款';
      case 'daily_bonus': return '每日奖励';
      default: return type;
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'purchase': return '#2563eb';
      case 'usage': return '#dc2626';
      case 'bonus': return '#16a34a';
      case 'refund': return '#0891b2';
      case 'daily_bonus': return '#ca8a04';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#6b7280' }}>Loading...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>Please sign in</h1>
          <p style={{ color: '#6b7280', marginBottom: '16px' }}>You need to be signed in to view your account.</p>
          <Link href="/api/auth/signin/google" style={{ padding: '10px 20px', backgroundColor: '#2563eb', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: '500' }}>
            Sign in with Google
          </Link>
        </div>
      </div>
    );
  }

  const hasSubscription = subscription && subscription.status === 'active';
  const purchaseTransactions = transactions.filter(t => t.type === 'purchase' || t.type === 'bonus');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid #e5e7eb', padding: '16px 0' }}>
        <div style={{ maxWidth: '768px', margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '14px' }}>← Back</Link>
            <h1 style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>My Account</h1>
          </div>
          <button
            onClick={refreshData}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ maxWidth: '768px', margin: '0 auto', padding: '48px 24px' }}>
        {/* Credits Section */}
        <div style={{ backgroundColor: hasSubscription ? '#f0fdf4' : '#eff6ff', border: `1px solid ${hasSubscription ? '#bbf7d0' : '#bfdbfe'}`, borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>Credits</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <div>
              <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Balance</p>
              <p style={{ fontSize: '24px', fontWeight: '600', color: '#111827' }}>{credits?.balance || 0}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Used</p>
              <p style={{ fontSize: '24px', fontWeight: '600', color: '#111827' }}>{credits?.totalUsed || 0}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Purchased</p>
              <p style={{ fontSize: '24px', fontWeight: '600', color: '#111827' }}>{credits?.totalPurchased || 0}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Bonus</p>
              <p style={{ fontSize: '24px', fontWeight: '600', color: '#111827' }}>{credits?.bonusReceived || 0}</p>
            </div>
          </div>
          
          {hasSubscription && (
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#22c55e', fontSize: '16px' }}>✓</span>
              <span style={{ fontSize: '14px', color: '#374151' }}>Unlimited mode active</span>
            </div>
          )}
        </div>

        {/* Subscription Summary Section */}
        {hasSubscription ? (
          <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                  Pro {subscription.plan === 'yearly' ? 'Yearly' : 'Monthly'}
                </h2>
                <p style={{ fontSize: '14px', color: '#6b7280' }}>
                  {subscription.plan === 'yearly' ? '$69/year' : '$10/month'}
                </p>
              </div>
              <span style={{ backgroundColor: '#22c55e', color: 'white', padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: '500' }}>
                Active
              </span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Valid until</p>
                <p style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                  {subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Total subscriptions</p>
                <p style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                  {subscription.total_subscriptions || allSubscriptions.length} 笔
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '32px', border: '1px solid #e5e7eb', borderRadius: '12px', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
              No Active Subscription
            </h2>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
              Subscribe to Pro for unlimited access with no credits needed.
            </p>
            <Link href="/pricing" style={{ display: 'inline-block', padding: '10px 20px', backgroundColor: '#2563eb', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: '500' }}>
              View Plans
            </Link>
          </div>
        )}

        {/* Credit Purchase Records */}
        {purchaseTransactions.length > 0 && (
          <div style={{ backgroundColor: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#92400e', marginBottom: '16px' }}>
              💰 积分购买记录 ({purchaseTransactions.length} 笔)
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {purchaseTransactions.map((tx, index) => (
                <div 
                  key={tx.id || index}
                  style={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #fef3c7', 
                    borderRadius: '8px', 
                    padding: '16px' 
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                        {tx.description || getTransactionTypeLabel(tx.type)}
                      </p>
                      <p style={{ fontSize: '12px', color: '#6b7280' }}>
                        时间: {formatDate(tx.created_at)}
                      </p>
                    </div>
                    <span style={{ 
                      backgroundColor: tx.amount >= 0 ? '#dcfce7' : '#fee2e2', 
                      color: tx.amount >= 0 ? '#166534' : '#991b1b', 
                      padding: '6px 12px', 
                      borderRadius: '6px', 
                      fontSize: '14px', 
                      fontWeight: '600' 
                    }}>
                      {tx.amount >= 0 ? '+' : ''}{tx.amount}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ 
                        fontSize: '11px', 
                        color: 'white', 
                        backgroundColor: getTransactionTypeColor(tx.type),
                        padding: '2px 8px', 
                        borderRadius: '9999px',
                        fontWeight: '500'
                      }}>
                        {getTransactionTypeLabel(tx.type)}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#6b7280' }}>
                      变动后余额: <span style={{ fontWeight: '600', color: '#111827' }}>{tx.balance_after}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Subscriptions List */}
        {allSubscriptions.length > 0 && (
          <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1e40af', marginBottom: '16px' }}>
              📋 订阅记录 ({allSubscriptions.length} 笔)
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {allSubscriptions.map((sub, index) => (
                <div 
                  key={sub.id || index}
                  style={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #bfdbfe', 
                    borderRadius: '8px', 
                    padding: '16px' 
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                        {getPlanName(sub.plan)}
                      </p>
                      <p style={{ fontSize: '12px', color: '#6b7280' }}>
                        订阅时间: {formatDate(sub.created_at)}
                      </p>
                    </div>
                    <span style={{ 
                      backgroundColor: sub.status === 'active' ? '#dcfce7' : '#f3f4f6', 
                      color: sub.status === 'active' ? '#166534' : '#6b7280', 
                      padding: '4px 10px', 
                      borderRadius: '9999px', 
                      fontSize: '11px', 
                      fontWeight: '500' 
                    }}>
                      {sub.status === 'active' ? '有效' : sub.status}
                    </span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    <div>
                      <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '2px' }}>开始时间</p>
                      <p style={{ fontSize: '12px', color: '#374151' }}>
                        {formatDate(sub.current_period_start)}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '2px' }}>到期时间</p>
                      <p style={{ fontSize: '12px', color: '#374151' }}>
                        {formatDate(sub.current_period_end)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {hasSubscription && (
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <button
              style={{ padding: '10px 20px', backgroundColor: '#f9fafb', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', fontWeight: '500', cursor: 'pointer' }}
              onClick={() => alert('Coming soon')}
            >
              Update Payment Method
            </button>
            <button
              onClick={handleCancel}
              style={{ padding: '10px 20px', backgroundColor: 'white', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', fontWeight: '500', cursor: 'pointer' }}
            >
              Cancel Subscription
            </button>
          </div>
        )}

        {/* Quick Links */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          <Link href="/pricing" style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', textAlign: 'center', textDecoration: 'none' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>💳</div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>Buy Credits</div>
          </Link>
          <Link href="/pricing" style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', textAlign: 'center', textDecoration: 'none' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📋</div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>Subscribe</div>
          </Link>
          <Link href="/profile" style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', textAlign: 'center', textDecoration: 'none' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📊</div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>History</div>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ backgroundColor: '#f9fafb', padding: '24px 0', borderTop: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: '768px', margin: '0 auto', textAlign: 'center', fontSize: '12px', color: '#9ca3af' }}>
          <p>© 2026 Image Background Remover. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
