import { AuthGate } from "../auth/AuthGate";

export default function CreateOrgPage() {
  return <AuthGate initialMode="create" />;
}