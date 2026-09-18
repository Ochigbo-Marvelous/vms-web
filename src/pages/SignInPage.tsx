import { AuthGate } from "../auth/AuthGate";

export default function SignInPage() {
  return <AuthGate initialMode="sign" />;
}