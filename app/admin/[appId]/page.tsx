import { getApp, getTestersForApp } from '@/util/firebase-admin';
import { getSessionFromCookie } from '@/util/auth';
import { APP_URL_BASE } from '@/lib/consts';
import CopyButton from './copy-button';
import LoginPrompt from './login-prompt';
import styles from './page.module.css';

interface AdminPageProps {
  params: Promise<{ appId: string }>;
}

export default async function AdminPage({ params }: AdminPageProps) {
  const resolvedParams = await params;
  const { appId } = resolvedParams;

  // Check if user is authenticated
  const session = await getSessionFromCookie();
  
  if (!session) {
    return <LoginPrompt appId={appId} />;
  }
  
  try {
    const [app, testers] = await Promise.all([
      getApp(appId),
      getTestersForApp(appId)
    ]);

    if (!app) {
      return (
        <div className={styles.container}>
          <div className={styles.error}>App not found</div>
        </div>
      );
    }

    const signupUrl = `${APP_URL_BASE}/signup/${appId}`;
    
    // Calculate statistics
    const stats = {
      totalTesters: testers.length,
      joinedGroup: testers.filter(t => t.hasJoinedGroup).length,
      codesAssigned: testers.filter(t => t.promotionalCode).length,
      availableCodes: app.promotionalCodes ? 
        app.promotionalCodes.length - testers.filter(t => t.promotionalCode).length : 0
    };

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
              <div className={styles.statNumber}>{stats.joinedGroup}</div>
              <div className={styles.statLabel}>Joined Group</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNumber}>{stats.codesAssigned}</div>
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
            <CopyButton url={signupUrl} />
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
                  <div data-label="Email">{tester.email}</div>
                  <div data-label="Joined Group" className={tester.hasJoinedGroup ? styles.yes : styles.no}>
                    {tester.hasJoinedGroup ? 'Yes' : 'No'}
                  </div>
                  <div data-label="Promotional Code">{tester.promotionalCode || '-'}</div>
                  <div data-label="Joined At">
                    {tester.joinedAt instanceof Date ? 
                      tester.joinedAt.toLocaleDateString() : 
                      new Date(tester.joinedAt).toLocaleDateString()
                    }
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  } catch (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Failed to load app data</div>
      </div>
    );
  }
}