import GoogleSignInButton from "@/components/GoogleSignInButton";

interface SignInButtonProps {
  appId: string;
  secret?: string;
}

function SignInButton(props: SignInButtonProps) {
  const { appId, secret } = props;

  return <GoogleSignInButton appId={appId} secret={secret} />;
}

export default SignInButton;