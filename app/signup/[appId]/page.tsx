import { getApp, getTesterByEmail } from "@/util/firebase-admin";
import styles from "./page.module.css";

interface SignupPageProps {
  params: Promise<{ appId: string }>;
  searchParams: Promise<{
    email?: string;
    existing?: string;
    success?: string;
    code?: string;
    error?: string;
  }>;
}

export default async function SignupPage({
  params,
  searchParams,
}: SignupPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const { appId } = resolvedParams;
  const { email, existing, success, code, error } = resolvedSearchParams;

  try {
    const app = await getApp(appId);

    if (!app) {
      return (
        <div className={styles.container}>
          <div className={styles.error}>App not found</div>
        </div>
      );
    }

    let existingTester = null;
    if (email) {
      existingTester = await getTesterByEmail(email, appId);
    }

    // Show success state if redirected after successful signup
    if (success) {
      return (
        <div className={styles.container}>
          <header className={styles.header}>
            <h1>Join Beta Testing</h1>
            <h2>{app.appName}</h2>
          </header>

          <div className={styles.disclaimer}>
            <p>
              <strong>Disclaimer:</strong> This service is not affiliated with
              Google. We simply make it easier for you to sign up to the app
              developer's Google Group and receive your promotional code if
              applicable.
            </p>
          </div>

          <div className={styles.step}>
            <h3>✅ You're All Set!</h3>

            <div className={styles.success}>
              {existing
                ? `Welcome back! ${code ? `Your promotional code: ${code}` : "You can download the app below."}`
                : `Welcome! ${code ? `Your promotional code: ${code}` : "You are now registered for testing."}`}
            </div>

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

            {code && (
              <div className={styles.codeSection}>
                <h4>Your Promotional Code</h4>
                <div className={styles.promotionalCode}>{code}</div>
                <p>
                  Keep this code safe - you can return to this page anytime to
                  retrieve it.
                </p>
              </div>
            )}

            <div className={styles.returnSection}>
              <p>
                <strong>Returning tester?</strong> Enter your email below to
                retrieve your promotional code.
              </p>
              <form action={`/signup/${appId}`} method="GET">
                <input
                  type="email"
                  name="email"
                  placeholder="your-email@example.com"
                  className={styles.emailInput}
                  required
                />
                <button type="submit" className={styles.returnButton}>
                  Retrieve Code
                </button>
              </form>
            </div>
          </div>
        </div>
      );
    }

    // Show existing tester info
    if (email && existingTester) {
      return (
        <div className={styles.container}>
          <header className={styles.header}>
            <h1>Welcome Back!</h1>
            <h2>{app.appName}</h2>
          </header>

          <div className={styles.disclaimer}>
            <p>
              <strong>Disclaimer:</strong> This service is not affiliated with
              Google. We simply make it easier for you to sign up to the app
              developer's Google Group and receive your promotional code if
              applicable.
            </p>
          </div>

          <div className={styles.step}>
            <h3>Your Testing Access</h3>

            <div className={styles.success}>
              You're already registered for testing!
            </div>

            <div className={styles.downloadSection}>
              <h4>Download the App</h4>
              <p>You can download the app from the Google Play Store:</p>

              <a
                href={app.playStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.playStoreButton}
              >
                Download from Play Store
              </a>
            </div>

            {existingTester.promotionalCode && (
              <div className={styles.codeSection}>
                <h4>Your Promotional Code</h4>
                <div className={styles.promotionalCode}>
                  {existingTester.promotionalCode}
                </div>
              </div>
            )}

            <div className={styles.returnSection}>
              <a href={`/signup/${appId}`} className={styles.returnButton}>
                Back to Signup
              </a>
            </div>
          </div>
        </div>
      );
    }

    // Show error if there was one
    if (error) {
      return (
        <div className={styles.container}>
          <header className={styles.header}>
            <h1>Join Beta Testing</h1>
            <h2>{app.appName}</h2>
          </header>

          <div className={styles.disclaimer}>
            <p>
              <strong>Disclaimer:</strong> This service is not affiliated with
              Google. We simply make it easier for you to sign up to the app
              developer's Google Group and receive your promotional code if
              applicable.
            </p>
          </div>

          <div className={styles.step}>
            <div className={styles.error}>
              There was an error processing your request. Please try again.
            </div>

            <a href={`/signup/${appId}`} className={styles.returnButton}>
              Try Again
            </a>
          </div>
        </div>
      );
    }

    // Main signup flow
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>Join Beta Testing</h1>
          <h2>{app.appName}</h2>
        </header>

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
            enter your email below to get access:
          </p>

          <h4>Step 2: Enter Your Email</h4>
          <p>Enter the same email address you used to join the Google Group:</p>

          <form action="/api/testers" method="POST" className={styles.form}>
            <input type="hidden" name="appId" value={appId} />
            <input type="hidden" name="hasJoinedGroup" value="true" />

            <input
              type="email"
              name="email"
              required
              placeholder="your-email@example.com"
              className={styles.emailInput}
            />

            <button type="submit" className={styles.submitButton}>
              Get Access
            </button>
          </form>
        </div>

        <div className={styles.returnSection}>
          <p>
            <strong>Returning tester?</strong> Enter your email to retrieve your
            promotional code:
          </p>
          <form action={`/signup/${appId}`} method="GET">
            <input
              type="email"
              name="email"
              placeholder="your-email@example.com"
              className={styles.emailInput}
              required
            />
            <button type="submit" className={styles.returnButton}>
              Retrieve Code
            </button>
          </form>
        </div>
      </div>
    );
  } catch (err) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Failed to load app data</div>
      </div>
    );
  }
}
