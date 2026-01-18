import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Family Tickets
          </h1>
          <p className="text-muted-foreground">
            Submit and track support requests for the family
          </p>
        </div>

        <Link
          href="/login"
          className="inline-flex items-center justify-center w-full h-12 px-6 font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors"
        >
          Sign In to Continue
        </Link>
      </div>
    </main>
  );
}
