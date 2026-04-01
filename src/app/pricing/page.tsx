'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

const creditPackages = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 50,
    price: 5,
    pricePerCredit: 0.10,
    popular: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    credits: 200,
    price: 15,
    pricePerCredit: 0.075,
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    credits: 500,
    price: 39,
    pricePerCredit: 0.078,
    popular: false,
  },
];

const subscriptionPlans = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: 10,
    period: 'month',
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: 69,
    period: 'year',
    saving: 'Save $51',
  },
];

export default function Pricing() {
  const [session, setSession] = useState<any>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [activeSection, setActiveSection] = useState<'credits' | 'subscription'>('credits');
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [canceledMessage, setCanceledMessage] = useState('');
  const creditsRef = useRef<HTMLDivElement>(null);
  const subscriptionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        setSession(data);
        if (data?.user?.email) setEmail(data.user.email);
      })
      .catch(console.error);
  }, []);

  // Check for success/canceled in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      const type = params.get('type') || 'credits';
      const token = params.get('token');
      const planId = params.get('planId') || 'monthly';
      
      if (token) {
        capturePayment(token, type, planId);
      }
      setSuccessMessage(type === 'credits' ? 'Payment successful! Credits have been applied to your account.' : 'Subscription activated successfully!');
    }
    if (params.get('canceled') === 'true') {
      setCanceledMessage('Payment was canceled. Please try again.');
    }
  }, []);

  const capturePayment = async (token: string, type: string, planId: string = 'monthly') => {
    try {
      let response;
      if (type === 'subscription') {
        // For subscriptions, call capture-subscription
        response = await fetch('/api/payment/capture-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscriptionId: token, planId: planId }),
        });
      } else {
        // For credits, call capture-order
        response = await fetch('/api/payment/capture-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, type }),
        });
      }
      const data = await response.json();
      if (data.success) {
        setSuccessMessage(data.message);
        // Refresh session to get updated credits
        fetch('/api/auth/session').then(res => res.json()).then(setSession);
      } else {
        setSuccessMessage(data.error || 'Payment processing failed');
      }
    } catch (error) {
      console.error('Capture error:', error);
    }
  };

  // Track scroll position to highlight active section
  useEffect(() => {
    const handleScroll = () => {
      const creditsTop = creditsRef.current?.getBoundingClientRect().top || 0;
      const subscriptionTop = subscriptionRef.current?.getBoundingClientRect().top || 0;
      
      if (creditsTop <= 150 && creditsTop > subscriptionTop - 400) {
        setActiveSection('credits');
      } else if (subscriptionTop <= 150) {
        setActiveSection('subscription');
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleGetStarted = (item: any, type: string) => {
    if (!session) {
      alert('Please sign in first to make a purchase');
      window.location.href = '/api/auth/signin/google';
      return;
    }
    setSelectedItem({ ...item, type });
    setShowCheckout(true);
  };

  const handleCheckout = async () => {
    if (!email) {
      alert('Please enter your email');
      return;
    }

    try {
      const body: any = {};
      
      if (selectedItem.type === 'credits') {
        body.type = 'credits';
        body.packageId = selectedItem.id;
      } else {
        body.type = 'subscription';
        body.planId = selectedItem.id === 'yearly' || selectedItem.id === 'monthly' 
          ? (billingCycle === 'yearly' ? 'yearly' : 'monthly')
          : selectedItem.id;
      }

      // Use create-order for both credits and subscription
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      // Check if response is OK before parsing JSON
      if (!response.ok) {
        const text = await response.text();
        console.error('Payment API error:', response.status, text);
        try {
          const data = JSON.parse(text);
          alert('Payment error: ' + (data.error || 'Unknown error'));
        } catch {
          alert('Payment failed with status ' + response.status + ': ' + text.substring(0, 100));
        }
        return;
      }

      const data = await response.json();

      console.log('Payment response:', data); // Debug log

      if (data.error) {
        alert(data.error);
        return;
      }

      // For subscription: check for approve link
      if (data.links) {
        const approvalUrl = data.links.find((link: any) => link.rel === 'approve' || link.rel === 'payer-action');
        if (approvalUrl) {
          window.location.href = approvalUrl.href;
        } else {
          // No approve link found, show error
          console.error('No approve link found in response:', data);
          alert('Payment setup failed: No payment link found. Response: ' + JSON.stringify(data));
        }
      } else if (data.id) {
        // Subscription created but no links - might be pending
        console.log('Subscription created, ID:', data.id);
        alert('Subscription created! ID: ' + data.id + '. Please check your email for payment link.');
      } else {
        alert('Payment initialization failed. Please try again. Response: ' + JSON.stringify(data));
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Payment initialization failed. Please try again. Error: ' + error);
    }
  };

  const getPrice = (item: any) => {
    if (item.type === 'subscription' && item.id === 'yearly') {
      return '$69';
    }
    return `$${item.price}`;
  };

  const getPriceLabel = (item: any) => {
    if (item.type === 'subscription') {
      return item.id === 'yearly' ? '/year' : '/month';
    }
    return '';
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid #e5e7eb', padding: '16px 0' }}>
        <div style={{ maxWidth: '896px', margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '14px' }}>← Back</Link>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {session ? (
              <Link href="/subscription" style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: '#f3f4f6', color: '#374151', textDecoration: 'none', fontSize: '14px' }}>
                My Account
              </Link>
            ) : (
              <Link href="/api/auth/signin/google" style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: '#2563eb', color: 'white', textDecoration: 'none', fontSize: '14px' }}>
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Success/Canceled Messages */}
      {successMessage && (
        <div style={{ backgroundColor: '#d1fae5', border: '1px solid #34d399', borderRadius: '8px', padding: '16px', margin: '16px auto', maxWidth: '896px', textAlign: 'center', color: '#065f46' }}>
          ✓ {successMessage}
        </div>
      )}
      {canceledMessage && (
        <div style={{ backgroundColor: '#fee2e2', border: '1px solid #f87171', borderRadius: '8px', padding: '16px', margin: '16px auto', maxWidth: '896px', textAlign: 'center', color: '#991b1b' }}>
          ✕ {canceledMessage}
        </div>
      )}

      {/* Main Content */}
      <div style={{ maxWidth: '896px', margin: '0 auto', padding: '48px 24px' }}>
        {/* Page Title */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
            Pricing
          </h1>
          <p style={{ fontSize: '16px', color: '#6b7280' }}>Credits never expire. Subscribe for unlimited usage.</p>
        </div>

        {/* Credits Section */}
        <div ref={creditsRef} id="credits-anchor" style={{ marginBottom: '48px', paddingTop: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px', textAlign: 'center' }}>Buy Credits</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {creditPackages.map((pkg) => (
              <div key={pkg.id} style={{
                borderRadius: '12px', padding: '24px',
                border: pkg.popular ? '2px solid #2563eb' : '1px solid #e5e7eb',
                backgroundColor: pkg.popular ? '#eff6ff' : 'white',
                position: 'relative'
              }}>
                {pkg.popular && (
                  <div style={{
                    position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)',
                    backgroundColor: '#2563eb', color: 'white', padding: '2px 12px',
                    borderRadius: '9999px', fontSize: '12px', fontWeight: '500', whiteSpace: 'nowrap'
                  }}>
                    Most popular
                  </div>
                )}
                
                <div style={{ marginBottom: '16px', textAlign: 'center' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>{pkg.name}</h3>
                  <div style={{ fontSize: '32px', fontWeight: '600', color: '#111827' }}>${pkg.price}</div>
                </div>
                
                <div style={{ backgroundColor: '#f3f4f6', borderRadius: '8px', padding: '16px', marginBottom: '16px', textAlign: 'center' }}>
                  <span style={{ fontSize: '24px', fontWeight: '600', color: '#111827' }}>{pkg.credits}</span>
                  <span style={{ fontSize: '14px', color: '#6b7280', marginLeft: '4px' }}>credits</span>
                </div>
                
                <button
                  onClick={() => handleGetStarted(pkg, 'credits')}
                  style={{
                    width: '100%', padding: '10px', borderRadius: '8px',
                    fontWeight: '500', fontSize: '14px',
                    backgroundColor: pkg.popular ? '#2563eb' : '#f9fafb',
                    color: pkg.popular ? 'white' : '#374151',
                    border: pkg.popular ? 'none' : '1px solid #d1d5db',
                    cursor: 'pointer'
                  }}
                >
                  Buy now
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Subscription Section */}
        <div ref={subscriptionRef} id="subscription-anchor" style={{ paddingTop: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px', textAlign: 'center' }}>Or Subscribe for Unlimited</h2>
          
          {/* Billing Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
            <span style={{ fontSize: '14px', color: billingCycle === 'monthly' ? '#111827' : '#9ca3af', fontWeight: billingCycle === 'monthly' ? '500' : '400' }}>Monthly</span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              style={{
                width: '40px', height: '24px', borderRadius: '9999px',
                backgroundColor: billingCycle === 'yearly' ? '#22c55e' : '#d1d5db',
                border: 'none', cursor: 'pointer', position: 'relative',
                transition: 'background-color 0.2s'
              }}
            >
              <span style={{
                position: 'absolute', top: '2px',
                left: billingCycle === 'yearly' ? '20px' : '2px',
                width: '20px', height: '20px', borderRadius: '50%',
                backgroundColor: 'white', boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                transition: 'left 0.2s'
              }} />
            </button>
            <span style={{ fontSize: '14px', color: billingCycle === 'yearly' ? '#111827' : '#9ca3af', fontWeight: billingCycle === 'yearly' ? '500' : '400' }}>
              Pay annually
              {billingCycle === 'yearly' && (
                <span style={{ marginLeft: '4px', color: '#16a34a', fontWeight: '500' }}>Save 42%</span>
              )}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            {subscriptionPlans.map((plan) => (
              <div key={plan.id} style={{
                borderRadius: '12px', padding: '24px',
                border: plan.id === 'yearly' ? '2px solid #2563eb' : '1px solid #e5e7eb',
                backgroundColor: plan.id === 'yearly' ? '#eff6ff' : 'white',
                position: 'relative'
              }}>
                {plan.saving && (
                  <div style={{
                    position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)',
                    backgroundColor: '#16a34a', color: 'white', padding: '2px 12px',
                    borderRadius: '9999px', fontSize: '12px', fontWeight: '500', whiteSpace: 'nowrap'
                  }}>
                    {plan.saving}
                  </div>
                )}
                
                <div style={{ marginBottom: '16px', textAlign: 'center' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>{plan.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '32px', fontWeight: '600', color: '#111827' }}>
                      {billingCycle === 'yearly' && plan.id === 'monthly' ? '$69' : `$${plan.price}`}
                    </span>
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>
                      {billingCycle === 'yearly' && plan.id === 'monthly' ? '/year' : `/${plan.period}`}
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    console.log('Subscribe clicked, billingCycle:', billingCycle);
                    handleGetStarted({ 
                      ...plan, 
                      type: 'subscription', 
                      id: billingCycle === 'yearly' ? 'yearly' : 'monthly' 
                    }, 'subscription');
                  }}
                  style={{
                    width: '100%', padding: '10px', borderRadius: '8px',
                    fontWeight: '500', fontSize: '14px',
                    backgroundColor: plan.id === 'yearly' ? '#2563eb' : '#f9fafb',
                    color: plan.id === 'yearly' ? 'white' : '#374151',
                    border: plan.id === 'yearly' ? 'none' : '1px solid #d1d5db',
                    cursor: 'pointer'
                  }}
                >
                  Subscribe
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && selectedItem && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', maxWidth: '400px', width: '100%', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600' }}>
                {selectedItem.type === 'credits' ? 'Purchase Credits' : 'Subscribe'}
              </h3>
              <button onClick={() => setShowCheckout(false)} style={{ color: '#9ca3af', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            
            <div style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: '500' }}>{selectedItem.name}</span>
                <span style={{ fontWeight: '600' }}>
                  {getPrice(selectedItem)}{getPriceLabel(selectedItem)}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#6b7280' }}>
                {selectedItem.credits ? `${selectedItem.credits} credits` : 'Unlimited photos per month'}
              </p>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
              />
            </div>
            
            <button
              onClick={handleCheckout}
              disabled={checkoutLoading}
              style={{
                width: '100%', padding: '12px',
                backgroundColor: checkoutLoading ? '#ccc' : '#ffc439', 
                color: '#003087',
                border: 'none', borderRadius: '8px',
                fontWeight: '600', fontSize: '14px',
                cursor: checkoutLoading ? 'not-allowed' : 'pointer', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}
            >
              {checkoutLoading ? 'Processing...' : (
                <>
                  <span style={{ fontSize: '16px' }}>P</span>
                  Pay with PayPal
                </>
              )}
            </button>
            
            <p style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'center', marginTop: '12px' }}>
              Secure payment processed by PayPal
            </p>
          </div>
        </div>
      )}

      <footer style={{ backgroundColor: '#f9fafb', padding: '24px 0', borderTop: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: '896px', margin: '0 auto', textAlign: 'center', fontSize: '12px', color: '#9ca3af' }}>
          <p>© 2026 Image Background Remover. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
