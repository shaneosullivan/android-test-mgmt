"use client";

import { UserSession } from "@/util/auth";
import Button from "@/components/Button";
import styles from "./page.module.css";

interface AuthButtonProps {
  session: UserSession | null;
  redirectTo: string;
}

function AuthButton(props: AuthButtonProps) {
  const { session, redirectTo } = props;

  if (session) {
    return (
      <div className={styles.authSection}>
        <div className={styles.userInfo}>
          <div className={styles.signedInText}>
            Signed in as: <strong>{session.email}</strong>
          </div>
        </div>
        <form method="POST" action="/api/auth/logout">
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <Button
            type="submit"
            variant="secondary"
            className={styles.returnButton}
          >
            Sign out
          </Button>
        </form>
      </div>
    );
  }

  // If no session, don't render anything (this shouldn't happen in signup context)
  return null;
}

export default AuthButton;
