import {
  getApp,
  getTestersForApp,
  getPromotionalCodesForApp,
} from "@/lib/firebase";
import { getSessionFromCookie } from "@/util/auth";
import LoginPrompt from "./login-prompt";
import ErrorBox from "@/components/ErrorBox";
import AdminContent from "./admin-content";
import styles from "./page.module.css";

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
    const [app, testers, promotionalCodes] = await Promise.all([
      getApp(appId),
      getTestersForApp(appId),
      getPromotionalCodesForApp(appId),
    ]);

    if (!app) {
      return (
        <div className={styles.container}>
          <ErrorBox title="App not found" />
        </div>
      );
    }

    if (!app.isSetupComplete) {
      return (
        <div className={styles.container}>
          <ErrorBox
            title="App Setup Incomplete"
            message="This app registration was not completed successfully. Please try registering your app again."
          >
            <div style={{ textAlign: "center", marginTop: "16px" }}>
              <a
                href="/register"
                style={{ color: "#3b82f6", textDecoration: "underline" }}
              >
                Register App Again
              </a>
            </div>
          </ErrorBox>
        </div>
      );
    }

    // Serialize the data to ensure it can be passed to client components
    // Exclude owner tokens for security (they should never be sent to client)
    const { ownerAccessToken, ownerRefreshToken, ...appWithoutTokens } = app;
    const serializedApp = {
      ...appWithoutTokens,
      createdAt: app.createdAt.toISOString(),
    };

    const serializedTesters = testers.map((tester) => ({
      ...tester,
      joinedAt: tester.joinedAt.toISOString(),
    }));

    const serializedPromotionalCodes = promotionalCodes.map((code) => ({
      ...code,
      createdAt: code.createdAt.toISOString(),
      redeemedAt: code.redeemedAt ? code.redeemedAt.toISOString() : undefined,
    }));

    return (
      <AdminContent
        appId={appId}
        initialApp={serializedApp}
        initialTesters={serializedTesters}
        initialPromotionalCodes={serializedPromotionalCodes}
      />
    );
  } catch (error) {
    console.error("Admin page error:", error);

    return (
      <div className={styles.container}>
        <ErrorBox
          title="App Not Found"
          message={`The app "${appId}" could not be found. This might be because it hasn't been registered yet, or the URL is incorrect.`}
        >
          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <a
              href="/register"
              style={{
                display: "inline-block",
                padding: "12px 24px",
                backgroundColor: "#16a34a",
                color: "white",
                textDecoration: "none",
                borderRadius: "8px",
                fontWeight: "500",
                marginBottom: "16px",
              }}
            >
              Register Your App
            </a>
            <p style={{ margin: "8px 0", color: "#6b7280", fontSize: "14px" }}>
              or{" "}
              <a
                href="/"
                style={{ color: "#3b82f6", textDecoration: "underline" }}
              >
                return to homepage
              </a>
            </p>
          </div>
        </ErrorBox>
      </div>
    );
  }
}
