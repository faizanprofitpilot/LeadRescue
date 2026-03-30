import Link from "next/link";
import { AuthBranding } from "@/components/auth/auth-branding";
import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <AuthBranding />
        <div className="text-center">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Create your account
          </h1>
          <p className="mt-2 text-muted-foreground text-sm">
            Start turning missed calls into booked jobs.
          </p>
        </div>
        <SignupForm />
        <p className="text-center text-muted-foreground text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-foreground underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
