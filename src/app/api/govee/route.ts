import { NextResponse } from "next/server";
import { CONFIG } from "@/lib/config";
import { getState, setPower, GoveeNotConfiguredError } from "@/lib/govee/client";

function errorResponse(e: unknown) {
  if (e instanceof GoveeNotConfiguredError) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  return NextResponse.json({ error: "upstream" }, { status: 502 });
}

export async function GET() {
  if (!CONFIG.actions.govee.enabled) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  try {
    return NextResponse.json(await getState());
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(request: Request) {
  if (!CONFIG.actions.govee.enabled) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const body = await request.json().catch(() => null);
  if (typeof body?.power !== "boolean") return NextResponse.json({ error: "bad_request" }, { status: 400 });

  try {
    await setPower(body.power);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
