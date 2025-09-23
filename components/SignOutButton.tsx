"use client";

import { useState } from "react";
import Button from "./Button";

interface SignOutButtonProps {
  redirectTo?: string;
  className?: string;
  variant?: "primary" | "secondary";
}

function SignOutButton(props: SignOutButtonProps) {
  const { redirectTo = "/", className = "", variant = "secondary" } = props;
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);

    try {
      const response = await fetch("/api/auth/signout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ redirectTo }),
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = data.redirectTo || redirectTo;
      } else {
        console.error("Sign out failed");
        // Fallback: redirect anyway
        window.location.href = redirectTo;
      }
    } catch (error) {
      console.error("Sign out error:", error);
      // Fallback: redirect anyway
      window.location.href = redirectTo;
    }
  };

  return (
    <Button
      onClick={handleSignOut}
      disabled={isSigningOut}
      variant={variant}
      className={className}
    >
      {isSigningOut ? "Signing out..." : "Sign Out"}
    </Button>
  );
}

export default SignOutButton;
