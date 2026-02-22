/**
 * Servicio de Email — Resend + React Email
 *
 * Envío de emails transaccionales para confirmaciones de reservas de visitantes.
 */

import { createElement } from "react";
import { Resend } from "resend";
import {
  VisitorReservationEmail,
  type VisitorReservationEmailProps,
} from "./templates/visitor-reservation";

/** Parámetros para enviar el email de confirmación de visitante */
export interface SendVisitorEmailParams extends VisitorReservationEmailProps {
  /** Dirección de email del destinatario */
  to: string;
  /** Adjunto .pkpass para Apple Wallet (opcional) */
  pkpassBuffer?: Buffer | null;
}

/**
 * Envía el email de confirmación de reserva al visitante.
 * Adjunta el .pkpass si se proporciona y añade el enlace de Google Wallet.
 * Si no hay API key configurada, registra un aviso y no hace nada.
 */
export async function sendVisitorReservationEmail(
  params: SendVisitorEmailParams
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error(
      "RESEND_API_KEY no configurada — email de visitante no enviado"
    );
    return;
  }

  const resend = new Resend(apiKey);
  const fromAddress = process.env.RESEND_FROM_EMAIL ?? "noreply@parking.local";

  const attachments: { filename: string; content: Buffer }[] = [];
  if (params.pkpassBuffer) {
    attachments.push({
      filename: `plaza-${params.spotLabel.toLowerCase().replace(/\s+/g, "-")}.pkpass`,
      content: params.pkpassBuffer,
    });
  }

  const { to, pkpassBuffer: _, ...emailProps } = params;

  const { error } = await resend.emails.send({
    from: `Parking <${fromAddress}>`,
    to,
    subject: `Plaza ${params.spotLabel} reservada — ${params.date}`,
    react: createElement(VisitorReservationEmail, emailProps),
    attachments,
  });

  if (error) {
    throw new Error(`Error al enviar email al visitante: ${error.message}`);
  }
}
