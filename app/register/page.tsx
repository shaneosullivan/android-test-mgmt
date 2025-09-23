import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase";
import { getSessionFromCookie } from "@/util/auth";
import { validateConfig } from "@/util/config";
import { extractAppIdFromPlayStoreUrl } from "@/util/android-utils";
import AuthButton from "./auth-button";
import RegisterForm from "./register-form";
import ErrorBox from "@/components/ErrorBox";
import styles from "./page.module.css";

interface RegisterPageProps {
  searchParams: Promise<{
    appName?: string;
    googleGroupEmail?: string;
    playStoreUrl?: string;
    promotionalCodes?: string;
    error?: string;
    groupEmail?: string;
  }>;
}

export default async function Register(props: RegisterPageProps) {
  // Check if all required configuration is present
  const config = validateConfig();
  if (!config.isValid || !adminDb) {
    redirect("/config-missing");
  }

  // Check if user is authenticated
  const session = await getSessionFromCookie();

  // Get search parameters
  const searchParams = await props.searchParams;

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Register Your Android App</h1>
        <p>Set up your app for beta testing distribution</p>

        {searchParams.error === "authentication_required" && (
          <ErrorBox
            title="Authentication Required:"
            message="You must be signed in to register an app."
          />
        )}

        {searchParams.error === "group_access_denied" && (
          <ErrorBox
            title="Google Group Access Issue:"
            message={`Cannot access or manage the Google Group ${searchParams.groupEmail || searchParams.googleGroupEmail}.`}
          >
            <div style={{ textAlign: "left" }}>
              <p>Please verify:</p>
              <ul>
                <li>The group email address is correct</li>
                <li>The Google Group exists</li>
                <li>You are signed in with the correct Google account</li>
                <li>Your account has admin permissions for this group</li>
                <li>The group is accessible (not private/restricted)</li>
              </ul>
            </div>
          </ErrorBox>
        )}

        {searchParams.error === "invalid_play_store_url" && (
          <ErrorBox
            title="Invalid Play Store URL"
            message="The Play Store URL you provided is not valid or we couldn't extract the Android app ID from it."
          >
            <div style={{ textAlign: "left" }}>
              <p>Please ensure your URL follows this format:</p>
              <code>
                https://play.google.com/store/apps/details?id=com.example.app
              </code>
            </div>
          </ErrorBox>
        )}

        {searchParams.error === "app_already_exists" &&
          (() => {
            const appId = searchParams.playStoreUrl
              ? extractAppIdFromPlayStoreUrl(searchParams.playStoreUrl)
              : null;
            const adminLink = appId ? `/admin/${appId}` : "/admin";

            return (
              <ErrorBox
                title="App Already Registered"
                message="This Android app has already been registered in our system."
              >
                <div style={{ textAlign: "left" }}>
                  <p>
                    Each Android app can only be registered once. If you are the
                    owner of this app and need to make changes, please contact
                    support or use the <a href={adminLink}>Admin Page</a> for
                    the app. .
                  </p>
                </div>
              </ErrorBox>
            );
          })()}

        {searchParams.error === "missing_required_fields" && (
          <ErrorBox
            title="Missing Required Information"
            message="Please fill in all required fields: App Name, Google Group Email, and Play Store URL."
          />
        )}

        {searchParams.error === "creation_failed" && (
          <ErrorBox
            title="Registration Failed"
            message="There was an unexpected error while registering your app. Please try again or contact support if the problem persists."
          />
        )}

        <div className={styles.disclaimer}>
          <p>
            <strong>Disclaimer:</strong> This service is not affiliated with
            Google. It simply helps you automate the process of managing Google
            Groups for beta testing and distributing promotional codes to your
            testers.
          </p>
        </div>

        {!session && (
          <div className={styles.authNotice}>
            <p>
              <strong>🔐 Authentication Required:</strong> Before registering
              your app, you must sign in with the same Google account that
              administers your Google Group. This allows us to verify your
              permissions and manage group membership on your behalf.
            </p>
          </div>
        )}

        <AuthButton session={session} />

        <RegisterForm
          session={session}
          defaultValues={{
            appName: searchParams.appName || "",
            googleGroupEmail: searchParams.googleGroupEmail || "",
            playStoreUrl: searchParams.playStoreUrl || "",
            promotionalCodes: searchParams.promotionalCodes || "",
          }}
        />
      </main>
    </div>
  );
}
