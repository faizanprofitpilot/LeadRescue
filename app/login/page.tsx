import Link from "next/link";
import { AuthBranding } from "@/components/auth/auth-branding";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <AuthBranding />
        <div className="text-center">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Sign in to LeadRescue
          </h1>
          <p className="mt-2 text-muted-foreground text-sm">
            Recover missed-call leads automatically.
          </p>
        </div>
        <LoginForm nextPath={next} authError={error} />
        <p className="text-center text-muted-foreground text-sm">
          No account?{" "}
          <Link href="/signup" className="text-foreground underline underline-offset-4">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
