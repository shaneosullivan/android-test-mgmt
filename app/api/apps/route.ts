import { NextRequest, NextResponse } from 'next/server';
import { createApp } from '@/util/firebase-admin';
import { redirect } from 'next/navigation';

function parsePromotionalCodes(csvText: string): string[] {
  if (!csvText.trim()) return [];
  
  return csvText
    .split(/[\n,]/)
    .map(code => code.trim())
    .filter(code => code.length > 0);
}

async function parseCSVFile(file: File): Promise<string[]> {
  const text = await file.text();
  return parsePromotionalCodes(text);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const appName = formData.get('appName') as string;
    const googleGroupEmail = formData.get('googleGroupEmail') as string;
    const playStoreUrl = formData.get('playStoreUrl') as string;
    const promotionalCodes = formData.get('promotionalCodes') as string;
    const promotionalCodesFile = formData.get('promotionalCodesFile') as File | null;

    if (!appName || !googleGroupEmail || !playStoreUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let promotionalCodesArray: string[] = [];

    // Handle CSV file upload first (takes precedence over textarea)
    if (promotionalCodesFile && promotionalCodesFile.size > 0) {
      promotionalCodesArray = await parseCSVFile(promotionalCodesFile);
    } else if (promotionalCodes) {
      // Fallback to textarea input
      promotionalCodesArray = parsePromotionalCodes(promotionalCodes);
    }

    const appId = await createApp({
      appName,
      googleGroupEmail,
      playStoreUrl,
      promotionalCodes: promotionalCodesArray.length > 0 ? promotionalCodesArray : undefined,
      ownerId: 'temp-owner-id'
    });

    return redirect(`/admin/${appId}`);
  } catch (error) {
    console.error('App creation failed:', error);
    
    if (error instanceof Error && error.message.includes('Missing environment variables')) {
      return redirect('/config-missing');
    }
    
    return NextResponse.json(
      { error: 'Failed to create app' },
      { status: 500 }
    );
  }
}