import { redirect } from "next/navigation";
import { getApp, createTester, getTesterByEmail } from "@/lib/firebase";
import { getSessionFromCookie } from "@/util/auth";
import ErrorBox from "@/components/ErrorBox";
import SignInButton from "./sign-in-button";
import styles from "../page.module.css";

interface CompletePageProps {
  params: Promise<{ appId: string }>;
  searchParams: Promise<{
    s?: string; // AppIdSecret
  }>;
}

export default async function CompletePage({
  params,
  searchParams,
}: CompletePageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const { appId } = resolvedParams;
  const { s: secret } = resolvedSearchParams;

  try {
    const app = await getApp(appId);

    if (!app) {
      return (
        <div className={styles.container}>
          <ErrorBox title="App not found" />
        </div>
      );
    }

    // Verify the secret parameter
    if (!secret || secret !== app.appIdSecret) {
      return (
        <div className={styles.container}>
          <ErrorBox 
            title="Permission Denied"
            message="Invalid or missing access token. Please use the correct link from your Google Group welcome message."
          />
        </div>
      );
    }

    // Check if user is authenticated
    const session = await getSessionFromCookie();

    if (!session) {
      return (
        <div className={styles.container}>
          <header className={styles.header}>
            <h1>Get Your Promotional Code</h1>
            <h2>{app.appName}</h2>
          </header>

          <div className={styles.step}>
            <h3>Sign in to get your promotional code</h3>
            <p>
              You need to sign in with your Google account to receive your promotional code.
            </p>
            
            <SignInButton returnTo={`/signup/${appId}/complete?s=${secret}`} />
          </div>
        </div>
      );
    }

    // Check if user is already registered
    let existingTester = await getTesterByEmail(session.email, appId);
    
    if (!existingTester) {
      // Create new tester entry
      await createTester({
        email: session.email,
        appId: appId,
        hasJoinedGroup: true, // They're coming from the group welcome message
        promotionalCode: undefined, // Will be assigned next
      });
      
      // Fetch the newly created tester to get promotional code assignment
      existingTester = await getTesterByEmail(session.email, appId);
    }

    // Show success with promotional code
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>Welcome to Beta Testing!</h1>
          <h2>{app.appName}</h2>
        </header>

        <div className={styles.step}>
          <div className={styles.success}>
            ✅ You're now registered for beta testing!
          </div>

          {existingTester?.promotionalCode && (
            <div className={styles.codeSection}>
              <h3>Your Promotional Code</h3>
              <div className={styles.promotionalCode}>
                {existingTester.promotionalCode}
              </div>
              <p>Use this code to get the app for free on the Play Store.</p>
            </div>
          )}

          <div className={styles.downloadSection}>
            <h3>Download the App</h3>
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

          <div className={styles.returnSection}>
            <a href={`/signup/${appId}`} className={styles.returnButton}>
              ← Back to App Info
            </a>
          </div>
        </div>
      </div>
    );

  } catch (error) {
    return (
      <div className={styles.container}>
        <ErrorBox title="Failed to process request" />
      </div>
    );
  }
}