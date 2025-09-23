import React from "react";
import styles from "./Button.module.css";

interface GoogleSignInButtonProps {
  /**
   * The URL to redirect to after successful authentication.
   * Can be a relative path (e.g., "/admin/app123") or a special state (e.g., "signup_app123")
   */
  returnTo?: string;
  
  /**
   * For complete flows where we need to preserve query parameters like the secret
   */
  appId?: string;
  secret?: string;
  
  /**
   * Custom button text - defaults to "Sign in with Google"
   */
  children?: React.ReactNode;
  
  /**
   * Additional props passed to the link
   */
  className?: string;
  
  /**
   * Whether this is for a consumer Google Group (uses minimal permissions)
   */
  isConsumerGroup?: boolean;
}

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
    <path
      fill="#4285F4"
      d="m18 9.2c0-.8-.1-1.6-.3-2.4H9.2v4.5h5c-.2 1.2-.9 2.2-1.8 2.9v2.4h2.9c1.7-1.6 2.7-3.9 2.7-6.6z"
    />
    <path
      fill="#34A853"
      d="M9.2 18c2.4 0 4.4-.8 5.9-2.2l-2.9-2.4c-.8.5-1.8.9-3 .9-2.3 0-4.3-1.6-5-3.7H1.1v2.4C2.6 15.8 5.7 18 9.2 18z"
    />
    <path
      fill="#FBBC04"
      d="M4.2 10.7c-.2-.5-.2-1.1-.2-1.7s.1-1.2.2-1.7V4.9H1.1C.4 6.2 0 7.6 0 9.1s.4 2.9 1.1 4.2l3.1-2.4z"
    />
    <path
      fill="#EA4335"
      d="M9.2 3.6c1.3 0 2.5.4 3.4 1.3L15 2.6C13.6 1.2 11.6.5 9.2.5 5.7.5 2.6 2.7 1.1 5.5l3.1 2.4c.7-2.1 2.7-3.7 5-3.7z"
    />
  </svg>
);

function GoogleSignInButton(props: GoogleSignInButtonProps) {
  const { 
    returnTo, 
    appId, 
    secret, 
    children = "Sign in with Google",
    className = "",
    isConsumerGroup = false
  } = props;

  // Calculate the href at render time
  const getGoogleAuthUrl = (): string => {
    const params = new URLSearchParams();
    
    // Handle different flow types
    if (appId && secret) {
      // Complete flow - preserve secret parameter
      const state = `complete_${appId}`;
      params.set('state', state);
      params.set('returnTo', `/signup/${appId}/complete?s=${secret}`);
    } else if (returnTo?.startsWith('signup_')) {
      // Signup flow - use the returnTo as state directly
      params.set('state', returnTo);
    } else if (returnTo) {
      // Regular redirect flow
      params.set('state', returnTo);
    } else {
      // Default fallback
      params.set('state', '/register');
    }
    
    // Add consumer group flag if specified
    if (isConsumerGroup) {
      params.set('consumerGroup', 'true');
    }
    
    return `/api/auth/google?${params.toString()}`;
  };

  const buttonClass = `${styles.button} ${styles.google} ${className}`;

  return (
    <a 
      href={getGoogleAuthUrl()}
      className={buttonClass}
      role="button"
    >
      <GoogleIcon />
      {children}
    </a>
  );
}

export default GoogleSignInButton;