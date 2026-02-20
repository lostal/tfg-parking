/**
 * Webhook del Bot de Teams
 *
 * Recibe mensajes entrantes del Bot Framework de Microsoft Teams.
 * Se implementará en P5.
 */

import { NextResponse } from "next/server";

export async function POST() {
  // TODO: Implementar el handler del webhook del bot de Teams
  return NextResponse.json({ status: "not_implemented" }, { status: 501 });
}
