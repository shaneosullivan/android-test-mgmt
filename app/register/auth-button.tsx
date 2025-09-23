"use client";

import { UserSession } from "@/util/auth";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import Button from "@/components/Button";
import styles from "./page.module.css";

interface AuthButtonProps {
  session: UserSession | null;
}

function AuthButton(props: AuthButtonProps) {
  const { session } = props;

  if (session) {
    return (
      <div className={styles.authSection}>
        <div className={styles.userInfo}>
          {session.picture && (
            <img
              src={session.picture}
              alt={session.name}
              className={styles.userAvatar}
            />
          )}
          <div className={styles.userDetails}>
            <p className={styles.userName}>{session.name}</p>
            <p className={styles.userEmail}>{session.email}</p>
          </div>
        </div>
        <form method="POST" action="/api/auth/logout">
          <input type="hidden" name="redirectTo" value="/register" />
          <Button type="submit" variant="secondary">
            Sign out
          </Button>
        </form>
        <p className={styles.authHelp}>
          ✅ You're signed in and can now register your app.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.authSection}>
      <GoogleSignInButton returnTo="/register" />
      <p className={styles.authHelp}>
        You'll be redirected to Google to sign in with your Google Groups
        administrator account.
      </p>
    </div>
  );
}

export default AuthButton;
