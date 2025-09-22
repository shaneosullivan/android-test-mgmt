'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getApp, getTestersForApp, type AppData, type TesterData } from '@/util/firebase';
import { APP_URL_BASE } from '@/lib/consts';
import styles from './page.module.css';

export default function AdminPage() {
  const params = useParams();
  const appId = params.appId as string;
  
  const [app, setApp] = useState<AppData | null>(null);
  const [testers, setTesters] = useState<TesterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  const signupUrl = `${APP_URL_BASE}/signup/${appId}`;
  
  useEffect(() => {
    async function loadData() {
      try {
        const [appData, testersData] = await Promise.all([
          getApp(appId),
          getTestersForApp(appId)
        ]);

        if (!appData) {
          setError('App not found');
          return;
        }

        setApp(appData);
        setTesters(testersData);
      } catch (err) {
        setError('Failed to load app data');
      } finally {
        setLoading(false);
      }
    }

    if (appId) {
      loadData();
    }
  }, [appId]);

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(signupUrl);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  }

  function getStats() {
    const totalTesters = testers.length;
    const testersWithCodes = testers.filter(t => t.promotionalCode).length;
    const availableCodes = app?.promotionalCodes ? app.promotionalCodes.length - testersWithCodes : 0;
    
    return {
      totalTesters,
      testersWithCodes,
      availableCodes
    };
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error || 'App not found'}</div>
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>{app.appName} - Admin</h1>
        <p>Manage your beta testing distribution</p>
      </header>

      <section className={styles.section}>
        <h2>App Details</h2>
        <div className={styles.details}>
          <div className={styles.detail}>
            <strong>Google Group:</strong> {app.googleGroupEmail}
          </div>
          <div className={styles.detail}>
            <strong>Play Store URL:</strong>{' '}
            <a href={app.playStoreUrl} target="_blank" rel="noopener noreferrer">
              {app.playStoreUrl}
            </a>
          </div>
          <div className={styles.detail}>
            <strong>Total Promotional Codes:</strong> {app.promotionalCodes?.length || 0}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Statistics</h2>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.statNumber}>{stats.totalTesters}</div>
            <div className={styles.statLabel}>Total Testers</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statNumber}>{stats.testersWithCodes}</div>
            <div className={styles.statLabel}>Codes Assigned</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statNumber}>{stats.availableCodes}</div>
            <div className={styles.statLabel}>Codes Available</div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Sign-up Link</h2>
        <p>Share this link with potential testers:</p>
        <div className={styles.urlContainer}>
          <input 
            type="text" 
            value={signupUrl} 
            readOnly 
            className={styles.urlInput}
          />
          <button 
            onClick={copyToClipboard}
            className={styles.copyButton}
          >
            {copiedToClipboard ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Testers ({testers.length})</h2>
        {testers.length === 0 ? (
          <p>No testers have signed up yet.</p>
        ) : (
          <div className={styles.testersTable}>
            <div className={styles.tableHeader}>
              <div>Email</div>
              <div>Joined Group</div>
              <div>Promotional Code</div>
              <div>Joined At</div>
            </div>
            {testers.map(tester => (
              <div key={tester.id} className={styles.tableRow}>
                <div>{tester.email}</div>
                <div className={tester.hasJoinedGroup ? styles.yes : styles.no}>
                  {tester.hasJoinedGroup ? 'Yes' : 'No'}
                </div>
                <div>{tester.promotionalCode || '-'}</div>
                <div>{tester.joinedAt.toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}