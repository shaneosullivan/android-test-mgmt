"use client";

import GoogleSignInButton from "@/components/GoogleSignInButton";
import styles from "./page.module.css";

interface LoginPromptProps {
  appId: string;
}

function LoginPrompt(props: LoginPromptProps) {
  const { appId } = props;

  const returnTo = `/admin/${appId}`;

  return (
    <div className={styles.container}>
      <div className={styles.loginPrompt}>
        <div className={styles.lockIcon}>🔐</div>
        <h1>Authentication Required</h1>
        <p>
          You must sign in with Google to access this admin page. Please use the
          same Google account that administers the Google Group for this app.
        </p>
        <GoogleSignInButton returnTo={returnTo} />
        <p className={styles.authHelp}>
          After signing in, you'll be redirected back to this admin page.
        </p>
      </div>
    </div>
  );
}

export default LoginPrompt;
