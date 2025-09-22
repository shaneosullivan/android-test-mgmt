export interface ConfigValidationResult {
  isValid: boolean;
  missing: string[];
  categories: {
    firebase: string[];
    oauth: string[];
  };
}

export function validateConfig(): ConfigValidationResult {
  // Firebase Admin SDK environment variables
  const firebaseVars = [
    "FIREBASE_PROJECT_ID",
    "GOOGLE_SERVICE_ACCOUNT_EMAIL",
    "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY",
  ];

  // Google OAuth environment variables
  const oauthVars = [
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_REDIRECT_URI",
    "JWT_SECRET",
  ];

  const allRequiredVars = [...firebaseVars, ...oauthVars];

  const missing = allRequiredVars.filter((varName) => !process.env[varName]);
  const missingFirebase = firebaseVars.filter(
    (varName) => !process.env[varName]
  );
  const missingOAuth = oauthVars.filter((varName) => !process.env[varName]);

  return {
    isValid: missing.length === 0,
    missing,
    categories: {
      firebase: missingFirebase,
      oauth: missingOAuth,
    },
  };
}
