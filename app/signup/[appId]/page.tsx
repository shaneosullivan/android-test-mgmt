'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getApp, getTesterByEmail, addTester, updateTester, assignPromotionalCode, type AppData, type TesterData } from '@/util/firebase';
import styles from './page.module.css';

export default function SignupPage() {
  const params = useParams();
  const appId = params.appId as string;
  
  const [app, setApp] = useState<AppData | null>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [existingTester, setExistingTester] = useState<TesterData | null>(null);
  const [step, setStep] = useState<'join-group' | 'enter-email' | 'complete'>('join-group');

  useEffect(() => {
    async function loadApp() {
      try {
        const appData = await getApp(appId);
        
        if (!appData) {
          setError('App not found');
          return;
        }
        
        setApp(appData);
      } catch (err) {
        setError('Failed to load app data');
      } finally {
        setLoading(false);
      }
    }

    if (appId) {
      loadApp();
    }
  }, [appId]);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !app) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const existing = await getTesterByEmail(email, appId);
      
      if (existing) {
        setExistingTester(existing);
        if (existing.promotionalCode) {
          setSuccess(`Your promotional code: ${existing.promotionalCode}`);
        } else if (app.promotionalCodes && app.promotionalCodes.length > 0) {
          const code = await assignPromotionalCode(appId, email);
          if (code) {
            await updateTester(existing.id, { 
              promotionalCode: code,
              hasJoinedGroup: true 
            });
            setSuccess(`Your promotional code: ${code}`);
            setExistingTester({...existing, promotionalCode: code, hasJoinedGroup: true});
          } else {
            setSuccess('All promotional codes have been assigned.');
          }
        } else {
          setSuccess('You are now registered for testing. You can download the app from the Play Store link below.');
        }
        setStep('complete');
      } else {
        let promotionalCode: string | undefined;
        
        if (app.promotionalCodes && app.promotionalCodes.length > 0) {
          const code = await assignPromotionalCode(appId, email);
          promotionalCode = code || undefined;
        }

        const testerId = await addTester({
          email,
          appId,
          promotionalCode,
          hasJoinedGroup: true
        });

        const newTester: TesterData = {
          id: testerId,
          email,
          appId,
          promotionalCode,
          hasJoinedGroup: true,
          joinedAt: new Date()
        };

        setExistingTester(newTester);
        
        if (promotionalCode) {
          setSuccess(`Welcome! Your promotional code: ${promotionalCode}`);
        } else if (app.promotionalCodes && app.promotionalCodes.length > 0) {
          setSuccess('All promotional codes have been assigned, but you can still test the app.');
        } else {
          setSuccess('Welcome! You are now registered for testing.');
        }
        
        setStep('complete');
      }
    } catch (err) {
      setError('Failed to process your request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleGroupJoined() {
    setStep('enter-email');
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (error && !app) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>App not found</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Join Beta Testing</h1>
        <h2>{app.appName}</h2>
      </header>

      {step === 'join-group' && (
        <div className={styles.step}>
          <h3>Step 1: Join the Google Group</h3>
          <p>
            To test this app, you need to join our beta testing Google Group. 
            Click the button below to join:
          </p>
          
          <a 
            href={`mailto:${app.googleGroupEmail}?subject=Join%20Beta%20Testing%20Group`}
            className={styles.groupButton}
            target="_blank"
            rel="noopener noreferrer"
          >
            Join Google Group
          </a>

          <p className={styles.instruction}>
            After joining the group (it may take a few minutes to be approved), 
            click the button below to continue:
          </p>

          <button 
            onClick={handleGroupJoined}
            className={styles.continueButton}
          >
            I've Joined the Group
          </button>
        </div>
      )}

      {step === 'enter-email' && (
        <div className={styles.step}>
          <h3>Step 2: Enter Your Email</h3>
          <p>
            Enter the same email address you used to join the Google Group:
          </p>

          <form onSubmit={handleEmailSubmit} className={styles.form}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your-email@example.com"
              className={styles.emailInput}
              disabled={submitting}
            />
            
            <button 
              type="submit" 
              disabled={submitting || !email.trim()}
              className={styles.submitButton}
            >
              {submitting ? 'Processing...' : 'Get Access'}
            </button>
          </form>

          {error && <div className={styles.error}>{error}</div>}
        </div>
      )}

      {step === 'complete' && (
        <div className={styles.step}>
          <h3>✅ You're All Set!</h3>
          
          {success && <div className={styles.success}>{success}</div>}

          <div className={styles.downloadSection}>
            <h4>Download the App</h4>
            <p>You can now download the app from the Google Play Store:</p>
            
            <a 
              href={app.playStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.playStoreButton}
            >
              Download from Play Store
            </a>
          </div>

          {existingTester?.promotionalCode && (
            <div className={styles.codeSection}>
              <h4>Your Promotional Code</h4>
              <div className={styles.promotionalCode}>
                {existingTester.promotionalCode}
              </div>
              <p>Keep this code safe - you can return to this page anytime to retrieve it.</p>
            </div>
          )}

          <div className={styles.returnSection}>
            <p>
              <strong>Returning tester?</strong> Enter your email above to retrieve your promotional code.
            </p>
            <button 
              onClick={() => {
                setStep('enter-email');
                setSuccess('');
                setError('');
                setEmail('');
                setExistingTester(null);
              }}
              className={styles.returnButton}
            >
              Enter Different Email
            </button>
          </div>
        </div>
      )}
    </div>
  );
}