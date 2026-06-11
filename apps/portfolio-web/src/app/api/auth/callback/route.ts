import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken, setSession } from "@/lib/oauth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    return NextResponse.json(
      { error: "Missing code or state parameter" },
      { status: 400 }
    );
  }

  // CSRF protection: validate state matches cookie
  const oauthStateCookie = request.cookies.get("oauth_state")?.value;
  if (!oauthStateCookie || oauthStateCookie !== state) {
    return NextResponse.json(
      { error: "Invalid state parameter — possible CSRF attack" },
      { status: 403 }
    );
  }

  // Retrieve the code verifier using the state value
  const codeVerifier = request.cookies.get(`oauth_verifier_${state}`)?.value;
  if (!codeVerifier) {
    return NextResponse.json(
      { error: "Missing code verifier — session may have expired" },
      { status: 400 }
    );
  }

  try {
    const accessToken = await exchangeCodeForToken(code, codeVerifier);
    await setSession(accessToken);

    const response = NextResponse.redirect(
      new URL("/admin", request.url)
    );

    // Clear OAuth cookies
    response.cookies.delete("oauth_state");
    response.cookies.delete(`oauth_verifier_${state}`);

    return response;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Token exchange failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
