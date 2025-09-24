import { redirect } from "next/navigation";
import {
  getApp,
  getTesterByEmail,
  updateTester,
  getAvailablePromotionalCode,
  redeemPromotionalCode,
} from "@/lib/firebase";
import { getSessionFromCookie } from "@/util/auth";
import ErrorBox from "@/components/ErrorBox";
import AppIcon from "@/components/AppIcon";
import PromotionalCodeDisplay from "@/components/PromotionalCodeDisplay";
import PlayStoreButton from "@/components/PlayStoreButton";
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
      // User is not authenticated, redirect to signup page
      return redirect(`/signup/${appId}`);
    }

    // Check if user is already registered for this app
    let existingTester = await getTesterByEmail(session.email, appId);

    if (!existingTester) {
      // User has a cookie but is not assigned to this app
      // Redirect them to the signup page for this app
      return redirect(`/signup/${appId}`);
    }

    // If the tester doesn't have a promotional code yet, assign one
    if (!existingTester.promotionalCode) {
      // Get available promotional code
      const availableCode = await getAvailablePromotionalCode(appId);
      let promotionalCode: string | undefined;

      if (availableCode) {
        // Mark the code as redeemed
        await redeemPromotionalCode(availableCode.id, session.email, appId);
        promotionalCode = availableCode.code;
      }

      // Update existing tester with promotional code and group membership
      const updates: any = {
        hasJoinedGroup: true, // They're coming from the group welcome message
      };

      // Only include promotionalCode if it's not undefined
      if (promotionalCode !== undefined) {
        updates.promotionalCode = promotionalCode;
      }

      await updateTester(existingTester.id, appId, updates);

      // Fetch the updated tester to get promotional code assignment
      existingTester = await getTesterByEmail(session.email, appId);
    }

    // Show success with promotional code
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.appIconContainer}>
            <AppIcon appName={app.appName} iconUrl={app.iconUrl} size={80} />
          </div>
          <div className={styles.headerContent}>
            <h1>Welcome to Beta Testing!</h1>
            <h2>{app.appName}</h2>
          </div>
        </header>

        <div className={styles.step}>
          <div className={styles.success}>
            ✅ You're now registered for beta testing!
          </div>

          <div className={styles.groupInfo}>
            <p>
              You've been automatically added to the Google Group:{" "}
              <strong>{app.googleGroupEmail}</strong>. This gives you access to the pre-release app.
            </p>
          </div>

          {existingTester?.promotionalCode && (
            <PromotionalCodeDisplay 
              code={existingTester.promotionalCode}
              description="Use this code to get the app for free on the Play Store."
            />
          )}

          <div className={styles.downloadSection}>
            <h3>Download the App</h3>
            <p>You can now download the app from the Google Play Store:</p>

            <PlayStoreButton url={app.playStoreUrl} />
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Complete page error:", error);
    // For most errors, redirect back to the signup page
    // This handles cases where the user/app relationship is problematic
    return redirect(`/signup/${appId}`);
  }
}
