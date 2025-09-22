import { validateConfig } from "@/util/config";
import styles from "./page.module.css";

interface EnvVarConfig {
  name: string;
  description: string;
  instructions: {
    title: string;
    steps: string[];
  };
}

const ENV_VARS: EnvVarConfig[] = [
  {
    name: "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    description: "Firebase project ID for the testing distribution service.",
    instructions: {
      title: "Setup:",
      steps: [
        "Go to Firebase Console (https://console.firebase.google.com/)",
        "Create a new project for this testing distribution service",
        "The project ID is visible in the Firebase Console URL and Project Settings",
      ],
    },
  },
  {
    name: "GOOGLE_SERVICE_ACCOUNT_EMAIL",
    description:
      "Service account for managing Google Groups across all registered Android apps.",
    instructions: {
      title: "Setup:",
      steps: [
        "Go to Google Cloud Console - Service Accounts (https://console.cloud.google.com/iam-admin/serviceaccounts)",
        "Create a service account with Google Groups API access",
        "Enable Groups Admin role in Google Workspace Admin Console",
        "Copy the service account email address",
      ],
    },
  },
  {
    name: "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY",
    description:
      "Private key for the Google Groups service account (PEM format).",
    instructions: {
      title: "Setup:",
      steps: [
        "In the service account, go to Keys tab",
        "Create new key → JSON format",
        'Use the "private_key" value from the JSON file',
        "Important: Preserve newline characters (\\n)",
      ],
    },
  },
  {
    name: "GOOGLE_CLIENT_ID",
    description: "Google OAuth Client ID for user authentication.",
    instructions: {
      title: "Setup:",
      steps: [
        "Go to Google Cloud Console - Credentials (https://console.cloud.google.com/apis/credentials)",
        'Click "Create Credentials" → "OAuth 2.0 Client IDs"',
        'Select "Web application" as application type',
        "Add your domain to authorized JavaScript origins",
        "Add your callback URL to authorized redirect URIs",
        "Copy the Client ID",
      ],
    },
  },
  {
    name: "GOOGLE_CLIENT_SECRET",
    description: "Google OAuth Client Secret for user authentication.",
    instructions: {
      title: "Setup:",
      steps: [
        "In the same OAuth 2.0 Client ID from above",
        "Copy the Client Secret value",
        "Keep this secret secure and never expose it publicly",
      ],
    },
  },
  {
    name: "GOOGLE_REDIRECT_URI",
    description: "OAuth callback URL for authentication flow.",
    instructions: {
      title: "Setup:",
      steps: [
        "Set this to: https://yourdomain.com/api/auth/callback",
        "For local development: http://localhost:3016/api/auth/callback",
        "Must match exactly what you configured in Google OAuth Client",
      ],
    },
  },
  {
    name: "JWT_SECRET",
    description: "Secret key for signing JWT tokens (session management).",
    instructions: {
      title: "Setup:",
      steps: [
        "Generate a secure random string (32+ characters)",
        "Use a password manager or: openssl rand -hex 32",
        "Keep this secret secure and never change it in production",
        "Different environments should use different secrets",
      ],
    },
  },
];

function checkEnvVar(name: string): boolean {
  const value = process.env[name];
  return Boolean(value && value.trim().length > 0);
}

export default function ConfigMissingPage() {
  const envStatus = ENV_VARS.map((envVar) => ({
    ...envVar,
    isConfigured: checkEnvVar(envVar.name),
  }));

  const configuredCount = envStatus.filter((env) => env.isConfigured).length;
  const totalCount = envStatus.length;
  const allConfigured = configuredCount === totalCount;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>
          {allConfigured ? "✅" : "⚠️"} Service Configuration{" "}
          {allConfigured ? "Complete" : "Required"}
        </h1>
        <p>
          {allConfigured
            ? "All environment variables are configured! Your service is ready."
            : `${configuredCount}/${totalCount} environment variables configured. This service needs Firebase and Google Groups API credentials to manage Android app testing distribution.`}
        </p>
      </header>

      <section className={styles.section}>
        <h2>Service Configuration Status</h2>
        <p>
          Configure these credentials once to enable the service to manage
          Google Groups and store data for all Android apps that sign up:
        </p>

        {envStatus.map((envVar) => (
          <div
            key={envVar.name}
            className={`${styles.envVar} ${envVar.isConfigured ? styles.configured : styles.notConfigured}`}
          >
            <h3>
              {envVar.isConfigured ? "✅" : "❌"} {envVar.name}
            </h3>
            <p>{envVar.description}</p>

            {envVar.isConfigured ? (
              <div className={styles.configuredMessage}>
                <strong>✓ Configured</strong>
              </div>
            ) : (
              <div className={styles.instructions}>
                <strong>{envVar.instructions.title}</strong>
                <ol>
                  {envVar.instructions.steps.map((step, index) => (
                    <li key={index}>
                      {step.includes("https://") ? (
                        <>
                          {step.split("(")[0]}
                          {step.includes("(") && (
                            <a
                              href={step.match(/\(([^)]+)\)/)?.[1]}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {step.match(/\(([^)]+)\)/)?.[1]}
                            </a>
                          )}
                          {step.includes(")") && step.split(")")[1]}
                        </>
                      ) : (
                        step
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        ))}
      </section>

      {!allConfigured && (
        <>
          <section className={styles.section}>
            <h2>Service Deployment</h2>

            <div className={styles.setupStep}>
              <h3>Environment Variables</h3>
              <p>Configure these credentials in your deployment environment:</p>
              <pre className={styles.codeBlock}>
                {`# Firebase Configuration
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYOUR_PRIVATE_KEY_HERE\\n-----END PRIVATE KEY-----\\n"

# Google OAuth Configuration  
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/callback
JWT_SECRET=your-secure-random-string-32-chars-or-more`}
              </pre>
            </div>

            <div className={styles.setupStep}>
              <h3>Hosting Platforms</h3>
              <ul>
                <li>
                  <strong>Vercel:</strong> Project Settings → Environment
                  Variables
                </li>
                <li>
                  <strong>Netlify:</strong> Site Settings → Environment
                  Variables
                </li>
                <li>
                  <strong>Railway:</strong> Variables tab in your project
                </li>
                <li>
                  <strong>Heroku:</strong> Settings → Config Vars
                </li>
              </ul>
            </div>
          </section>

          <section className={styles.section}>
            <h2>Required Service Setup</h2>

            <div className={styles.setupStep}>
              <h3>1. Firebase Setup</h3>
              <ul>
                <li>Enable Firestore Database in your Firebase project</li>
                <li>Configure Firestore security rules for app data storage</li>
              </ul>
            </div>

            <div className={styles.setupStep}>
              <h3>2. Google Cloud APIs</h3>
              <ul>
                <li>Enable Google Groups API in Google Cloud Console</li>
                <li>Enable Google+ API (for OAuth user info)</li>
                <li>
                  Set up Google Workspace Admin access for the service account
                </li>
              </ul>
            </div>

            <div className={styles.setupStep}>
              <h3>3. Google OAuth Setup</h3>
              <ul>
                <li>Create OAuth 2.0 Client ID in Google Cloud Console</li>
                <li>Configure authorized origins (your domain)</li>
                <li>Configure authorized redirect URIs (/api/auth/callback)</li>
                <li>Enable required OAuth scopes: profile, email, groups</li>
              </ul>
            </div>

            <div className={styles.setupStep}>
              <h3>4. Security Configuration</h3>
              <ul>
                <li>Generate secure JWT secret for session management</li>
                <li>Configure HTTPS for production (required for OAuth)</li>
                <li>Set up proper CORS headers if needed</li>
              </ul>
            </div>
          </section>
        </>
      )}

      <div className={styles.footer}>
        <p>
          {allConfigured
            ? "Your service is fully configured and ready to use!"
            : "Once configured, restart the service to enable Android app testing distribution."}
        </p>
        <a href="/" className={styles.homeButton}>
          {allConfigured ? "Go to Service" : "Return to Home"}
        </a>
      </div>
    </div>
  );
}
