'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createApp } from '@/util/firebase';
import styles from './page.module.css';

function parsePromotionalCodes(csvText: string): string[] {
  if (!csvText.trim()) return [];
  
  return csvText
    .split(/[\n,]/)
    .map(code => code.trim())
    .filter(code => code.length > 0);
}

export default function Home() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    appName: '',
    googleGroupEmail: '',
    playStoreUrl: '',
    promotionalCodes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const promotionalCodesArray = parsePromotionalCodes(formData.promotionalCodes);
      
      const appId = await createApp({
        appName: formData.appName,
        googleGroupEmail: formData.googleGroupEmail,
        playStoreUrl: formData.playStoreUrl,
        promotionalCodes: promotionalCodesArray.length > 0 ? promotionalCodesArray : undefined,
        ownerId: 'temp-owner-id'
      });

      router.push(`/admin/${appId}`);
    } catch (err) {
      if (err instanceof Error && err.message.includes('Missing environment variables')) {
        router.push('/config-missing');
      } else {
        setError('Failed to create app. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleChange(field: string, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Android Testing Promotion Setup</h1>
        <p>Set up your app for beta testing distribution</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="appName">App Name</label>
            <input
              id="appName"
              type="text"
              required
              value={formData.appName}
              onChange={(e) => handleChange('appName', e.target.value)}
              placeholder="My Awesome App"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="googleGroupEmail">Google Group Email</label>
            <input
              id="googleGroupEmail"
              type="email"
              required
              value={formData.googleGroupEmail}
              onChange={(e) => handleChange('googleGroupEmail', e.target.value)}
              placeholder="beta-testers@googlegroups.com"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="playStoreUrl">Play Store URL</label>
            <input
              id="playStoreUrl"
              type="url"
              required
              value={formData.playStoreUrl}
              onChange={(e) => handleChange('playStoreUrl', e.target.value)}
              placeholder="https://play.google.com/store/apps/details?id=com.example.app"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="promotionalCodes">
              Promotional Codes (optional)
              <small>Enter codes separated by commas or newlines</small>
            </label>
            <textarea
              id="promotionalCodes"
              value={formData.promotionalCodes}
              onChange={(e) => handleChange('promotionalCodes', e.target.value)}
              placeholder="CODE1, CODE2, CODE3"
              rows={4}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button 
            type="submit" 
            disabled={isSubmitting}
            className={styles.submitButton}
          >
            {isSubmitting ? 'Creating...' : 'Create App'}
          </button>
        </form>
      </main>
    </div>
  );
}
