import { signIn } from "@/auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const callbackUrl = url.searchParams.get("callbackUrl") || "/tickets";

  return signIn("s-auth", { redirectTo: callbackUrl });
}
