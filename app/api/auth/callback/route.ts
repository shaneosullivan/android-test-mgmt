import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens, getUserInfo, setSessionCookie, UserSession } from '@/util/auth';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state') || '/register';
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      new URL(`/register?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/register?error=no_code', request.url)
    );
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);
    
    if (!tokens.access_token) {
      throw new Error('No access token received');
    }

    // Get user info
    const userInfo = await getUserInfo(tokens.access_token);
    
    // Create session
    const session: UserSession = {
      id: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
    };

    // Set session cookie
    await setSessionCookie(session);

    // Redirect to intended destination
    return NextResponse.redirect(new URL(state, request.url));
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(`/register?error=auth_failed`, request.url)
    );
  }
}