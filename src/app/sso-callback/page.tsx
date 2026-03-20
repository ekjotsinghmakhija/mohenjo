import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SSOCallback() {
  // This component automatically handles the Clerk JWT handoff and redirects to '/'
  return (
    <div className="flex items-center justify-center min-h-screen bg-neutral-950">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
