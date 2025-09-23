import { NextRequest, NextResponse } from "next/server";
import {
  getApp,
  getTestersForApp,
  getPromotionalCodesForApp,
} from "@/lib/firebase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  try {
    const resolvedParams = await params;
    const appId = resolvedParams.appId;

    const [app, testers, promotionalCodes] = await Promise.all([
      getApp(appId),
      getTestersForApp(appId),
      getPromotionalCodesForApp(appId),
    ]);

    if (!app) {
      return NextResponse.json({ error: "App not found" }, { status: 404 });
    }

    const redeemedCodes = promotionalCodes.filter((code) => code.redeemedAt);
    const stats = {
      totalTesters: testers.length,
      joinedGroup: testers.filter((t) => t.hasJoinedGroup).length,
      codesAssigned: testers.filter((t) => t.promotionalCode).length,
      availableCodes: promotionalCodes.length - redeemedCodes.length,
    };

    return NextResponse.json({
      app,
      testers,
      promotionalCodes,
      stats,
    });
  } catch (error) {
    console.error("Failed to fetch app data:", error);
    return NextResponse.json(
      { error: "Failed to fetch app data" },
      { status: 500 }
    );
  }
}
