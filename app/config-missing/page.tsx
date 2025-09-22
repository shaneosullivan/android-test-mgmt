import styles from './page.module.css';

export default function ConfigMissingPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>⚠️ Configuration Required</h1>
        <p>Missing environment variables for Firebase and Google integration</p>
      </header>

      <section className={styles.section}>
        <h2>Required Environment Variables</h2>
        <p>Please set the following environment variables to use this application:</p>

        <div className={styles.envVar}>
          <h3>NEXT_PUBLIC_FIREBASE_API_KEY</h3>
          <p>Your Firebase API key from the Firebase console.</p>
          <div className={styles.instructions}>
            <strong>How to get it:</strong>
            <ol>
              <li>Go to <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer">Firebase Console</a></li>
              <li>Select your project (or create a new one)</li>
              <li>Go to Project Settings → General tab</li>
              <li>Scroll down to "Your apps" section</li>
              <li>Copy the API key from your web app configuration</li>
            </ol>
          </div>
        </div>

        <div className={styles.envVar}>
          <h3>NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN</h3>
          <p>Your Firebase Auth domain (usually: your-project-id.firebaseapp.com)</p>
          <div className={styles.instructions}>
            <strong>How to get it:</strong>
            <ol>
              <li>Same location as API key in Firebase Console</li>
              <li>It's the "authDomain" value in your web app configuration</li>
            </ol>
          </div>
        </div>

        <div className={styles.envVar}>
          <h3>NEXT_PUBLIC_FIREBASE_PROJECT_ID</h3>
          <p>Your Firebase project ID.</p>
          <div className={styles.instructions}>
            <strong>How to get it:</strong>
            <ol>
              <li>Visible in the Firebase Console URL</li>
              <li>Also in Project Settings → General tab</li>
            </ol>
          </div>
        </div>

        <div className={styles.envVar}>
          <h3>NEXT_PUBLIC_FIREBASE_APP_ID</h3>
          <p>Your Firebase app ID.</p>
          <div className={styles.instructions}>
            <strong>How to get it:</strong>
            <ol>
              <li>Same location as API key in Firebase Console</li>
              <li>It's the "appId" value in your web app configuration</li>
            </ol>
          </div>
        </div>

        <div className={styles.envVar}>
          <h3>GOOGLE_SERVICE_ACCOUNT_EMAIL</h3>
          <p>Email address of your Google service account for Google Groups API access.</p>
          <div className={styles.instructions}>
            <strong>How to get it:</strong>
            <ol>
              <li>Go to <a href="https://console.cloud.google.com/iam-admin/serviceaccounts" target="_blank" rel="noopener noreferrer">Google Cloud Console - Service Accounts</a></li>
              <li>Create a new service account or select existing one</li>
              <li>Grant it "Groups Admin" role or necessary Google Workspace permissions</li>
              <li>Copy the email address of the service account</li>
            </ol>
          </div>
        </div>

        <div className={styles.envVar}>
          <h3>GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY</h3>
          <p>Private key of your Google service account (in PEM format).</p>
          <div className={styles.instructions}>
            <strong>How to get it:</strong>
            <ol>
              <li>In the same service account from above</li>
              <li>Go to Keys tab</li>
              <li>Create new key → JSON format</li>
              <li>Use the "private_key" value from the downloaded JSON file</li>
              <li><strong>Important:</strong> Keep the newline characters (\n) in the key</li>
            </ol>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Setup Instructions</h2>
        
        <div className={styles.setupStep}>
          <h3>Local Development</h3>
          <p>Create a <code className={styles.inlineCode}>.env.local</code> file in your project root:</p>
          <pre className={styles.codeBlock}>
{`NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYOUR_PRIVATE_KEY_HERE\\n-----END PRIVATE KEY-----\\n"`}
          </pre>
        </div>

        <div className={styles.setupStep}>
          <h3>Production Deployment</h3>
          <p>Set these environment variables in your hosting platform:</p>
          <ul>
            <li><strong>Vercel:</strong> Project Settings → Environment Variables</li>
            <li><strong>Netlify:</strong> Site Settings → Environment Variables</li>
            <li><strong>Railway:</strong> Variables tab in your project</li>
            <li><strong>Heroku:</strong> Settings → Config Vars</li>
          </ul>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Firebase Setup</h2>
        <ol>
          <li>Enable Firestore Database in your Firebase project</li>
          <li>Set up security rules for Firestore</li>
          <li>Enable Google Groups API in Google Cloud Console</li>
          <li>Configure OAuth consent screen if needed</li>
        </ol>
      </section>

      <div className={styles.footer}>
        <p>Once you've configured all environment variables, restart your application.</p>
        <a href="/" className={styles.homeButton}>
          Return to Home
        </a>
      </div>
    </div>
  );
}