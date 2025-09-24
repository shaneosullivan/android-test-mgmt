import { redirect } from "next/navigation";
import { getApp, getTesterByEmail } from "@/lib/firebase";
import { getSessionFromCookie } from "@/util/auth";
import { APP_URL_BASE } from "@/lib/consts";
import ErrorBox from "@/components/ErrorBox";
import Button from "@/components/Button";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import AuthButton from "./auth-button";
import AppIcon from "@/components/AppIcon";
import PromotionalCodeDisplay from "@/components/PromotionalCodeDisplay";
import PlayStoreButton from "@/components/PlayStoreButton";
import styles from "./page.module.css";

interface SignupPageProps {
  params: Promise<{ appId: string }>;
  searchParams: Promise<{
    email?: string;
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
  const { email, success, code, error } = resolvedSearchParams;

  try {
    const app = await getApp(appId);

    if (!app) {
      return (
        <div className={styles.container}>
          <ErrorBox
            title="App Not Found"
            message={`The app "${appId}" could not be found. This might be because it hasn't been registered yet, or the URL is incorrect.`}
          >
            <div className={styles.errorActions}>
              <a href="/register" className={styles.registerAppButton}>
                Register Your App
              </a>
              <p className={styles.errorHelpText}>
                or{" "}
                <a href="/" className={styles.homeLink}>
                  return to homepage
                </a>
              </p>
            </div>
          </ErrorBox>
        </div>
      );
    }

    // Check if user is authenticated and if this is a consumer group
    const session = await getSessionFromCookie();
    const isConsumerGroup = app.googleGroupEmail.endsWith("@googlegroups.com");

    const completeUrl = `${APP_URL_BASE}/signup/${appId}/complete?s=${app.appIdSecret}`;

    console.log("completeUrl:", completeUrl);

    // Always check for tester status based on session or email param
    let existingTester = null;
    if (session) {
      // For authenticated users (both consumer and workspace groups), check their registration status
      existingTester = await getTesterByEmail(session.email, appId);
    } else if (email) {
      // For email lookups (returning testers)
      existingTester = await getTesterByEmail(email, appId);
    }

    // Show success state if redirected after successful signup
    if (success) {
      return (
        <div className={styles.container}>
          <header className={styles.header}>
            <div className={styles.appIconContainer}>
              <AppIcon appName={app.appName} iconUrl={app.iconUrl} size={80} />
            </div>
            <div>
              <h1>Join Beta Testing</h1>
              <h2>{app.appName}</h2>
            </div>
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
              Welcome! You are now registered for testing.
            </div>

            {code && (
              <PromotionalCodeDisplay 
                code={code}
                description="Keep this code safe - you can return to this page anytime to retrieve it."
              />
            )}

            <div className={styles.downloadSection}>
              <h4>Download the App</h4>
              <p>You can now download the app from the Google Play Store:</p>

              <PlayStoreButton url={app.playStoreUrl} />
            </div>

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
                <Button type="submit" variant="secondary">
                  Retrieve Code
                </Button>
              </form>
            </div>
          </div>
        </div>
      );
    }

    // Show existing tester info for email lookups only (not authenticated sessions)
    if (email && existingTester && !session) {
      return (
        <div className={styles.container}>
          <header className={styles.header}>
            <div className={styles.appIconContainer}>
              <AppIcon appName={app.appName} iconUrl={app.iconUrl} size={80} />
            </div>
            <div>
              <h1>Welcome Back!</h1>
              <h2>{app.appName}</h2>
            </div>
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

              <PlayStoreButton url={app.playStoreUrl} />
            </div>

            {existingTester.promotionalCode && (
              <PromotionalCodeDisplay 
                code={existingTester.promotionalCode}
              />
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
            <div className={styles.appIconContainer}>
              <AppIcon appName={app.appName} iconUrl={app.iconUrl} size={80} />
            </div>
            <div>
              <h1>Join Beta Testing</h1>
              <h2>{app.appName}</h2>
            </div>
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
            <ErrorBox
              title="Error Processing Request"
              message="There was an error processing your request. Please try again."
            />

            <a href={`/signup/${appId}`} className={styles.returnButton}>
              Try Again
            </a>
          </div>
        </div>
      );
    }

    // Check if user is already fully registered (has joined group and has promo code)
    // This applies to both consumer and workspace groups
    if (
      session &&
      existingTester &&
      existingTester.hasJoinedGroup &&
      existingTester.promotionalCode
    ) {
      // User is already fully registered, redirect to complete page
      return redirect(`/signup/${appId}/complete?s=${app.appIdSecret}`);
    }

    // For Workspace groups, if user is signed in and has been added (but no promo code yet),
    // redirect to complete page to assign promo code
    if (
      !isConsumerGroup &&
      session &&
      existingTester &&
      existingTester.hasJoinedGroup
    ) {
      // User has been added to Workspace group, redirect to complete page for promo code assignment
      return redirect(`/signup/${appId}/complete?s=${app.appIdSecret}`);
    }

    // Show "next steps" for consumer groups after user has signed in and registered
    if (isConsumerGroup && session && existingTester) {
      const groupName = app.googleGroupEmail.split("@")[0];

      return (
        <div className={styles.container}>
          <header className={styles.header}>
            <div className={styles.appIconContainer}>
              <AppIcon appName={app.appName} iconUrl={app.iconUrl} size={80} />
            </div>
            <div>
              <h1>Join Beta Testing</h1>
              <h2>{app.appName}</h2>
            </div>
          </header>

          <div className={styles.step}>
            <h3>✅ Account Verified</h3>
            <p>Great! Your email ({session.email}) has been verified.</p>

            <h4>Next Step: Join the Google Group</h4>
            <p>
              Now you need to join our Google Group to complete your
              registration. Click the link below to join:
            </p>

            <a
              href={`https://groups.google.com/g/${groupName}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.groupButton}
            >
              Join Google Group
            </a>

            <div className={styles.instructionalImage}>
              <p className={styles.instructionalCaption}>
                Example: Click the "Join the group" link when you see the page
                below after you have clicked the button above.
              </p>
              <img
                src="/images/sign_up_google_group.png"
                alt="Screenshot showing how to join a Google Group by clicking the 'Join the group' button"
              />
            </div>

            <div className={styles.instruction}>
              <p>
                <strong>Important:</strong> After joining the group, you'll be
                shown a welcome message with a link to get your promotional code
              </p>
              <p className={styles.codeInstructions}>
                Click that link to get your promotional code once you've joined
                the group.
              </p>
            </div>

            <AuthButton session={session} redirectTo={`/signup/${appId}`} />
          </div>
        </div>
      );
    }

    // Main signup flow
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.appIconContainer}>
            <AppIcon appName={app.appName} iconUrl={app.iconUrl} size={80} />
          </div>
          <div>
            <h1>Join Beta Testing</h1>
            <h2>{app.appName}</h2>
          </div>
        </header>

        {isConsumerGroup ? (
          // Consumer group flow - require Google Sign In first
          <div className={styles.step}>
            <h3>Step 1: Sign In with Google</h3>
            <p>
              To join the beta testing for this app, please sign in with your
              Google account. This will verify your email address for the
              testing program.
            </p>

            <GoogleSignInButton
              returnTo={`signup_${appId}`}
              isConsumerGroup={isConsumerGroup}
            />

            <p className={styles.instruction}>
              After signing in, we'll guide you through joining the Google Group
              and getting your promotional code.
            </p>
          </div>
        ) : (
          // Workspace group flow - simplified for automatic group addition
          <div className={styles.step}>
            <h3>Sign In to Join Beta Testing</h3>
            <p>
              To test this app, sign in with your Google account. We'll
              automatically add you to our beta testing Google Group and assign
              you a promotional code.
            </p>

            <GoogleSignInButton
              returnTo={`signup_${appId}`}
              isConsumerGroup={true}
            />

            <p className={styles.instruction}>
              After signing in, you'll be automatically added to the Google
              Group and receive your promotional code instantly.
            </p>
          </div>
        )}

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
            <Button type="submit" variant="secondary">
              Retrieve Code
            </Button>
          </form>
        </div>

        <AuthButton session={session} redirectTo={`/signup/${appId}`} />
      </div>
    );
  } catch (err) {
    console.error("Signup page error:", err);

    // Check if it's a Next.js redirect error (these should be allowed to propagate)
    if (
      err instanceof Error &&
      (err.message === "NEXT_REDIRECT" ||
        (err as any).digest?.startsWith("NEXT_REDIRECT"))
    ) {
      throw err;
    }

    return (
      <div className={styles.container}>
        <ErrorBox
          title="App Not Found"
          message={`The app "${appId}" could not be found. This might be because it hasn't been registered yet, or the URL is incorrect.`}
        >
          <div className={styles.errorActions}>
            <a href="/register" className={styles.registerAppButton}>
              Register Your App
            </a>
            <p className={styles.errorHelpText}>
              or{" "}
              <a href="/" className={styles.homeLink}>
                return to homepage
              </a>
            </p>
          </div>
        </ErrorBox>
      </div>
    );
  }
}
