import { NextRequest, NextResponse } from 'next/server';
import { getApp, getTesterByEmail } from '@/util/firebase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  try {
    const resolvedParams = await params;
    const appId = resolvedParams.appId;
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    const app = await getApp(appId);

    if (!app) {
      return NextResponse.json(
        { error: 'App not found' },
        { status: 404 }
      );
    }

    let tester = null;
    if (email) {
      tester = await getTesterByEmail(email, appId);
    }

    return NextResponse.json({
      app,
      tester
    });
  } catch (error) {
    console.error('Failed to fetch signup data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch app data' },
      { status: 500 }
    );
  }
}