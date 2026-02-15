/**
 * Teams Bot Webhook
 *
 * Receives incoming messages from Microsoft Teams Bot Framework.
 * Will be implemented in P5.
 */

import { NextResponse } from "next/server";

export async function POST() {
  // TODO: Implement Teams Bot webhook handler
  return NextResponse.json({ status: "not_implemented" }, { status: 501 });
}
