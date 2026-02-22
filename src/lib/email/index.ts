/**
 * Servicio de Email — Resend + React Email
 *
 * Envío de emails transaccionales para confirmaciones de reservas de visitantes.
 * Adjunta el archivo .ics para añadir el evento al calendario del visitante.
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
  /** Archivo .ics para añadir el evento al calendario */
  icsBuffer: Buffer;
}

/**
 * Envía el email de confirmación de reserva al visitante.
 * Adjunta el .ics para que el visitante pueda añadir el evento a su calendario.
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

  const { to, icsBuffer, ...emailProps } = params;

  const { error } = await resend.emails.send({
    from: `Gruposiete <${fromAddress}>`,
    to,
    subject: `Plaza ${params.spotLabel} reservada — ${params.date}`,
    react: createElement(VisitorReservationEmail, emailProps),
    attachments: [
      {
        filename: `reserva-plaza-${params.spotLabel.toLowerCase().replace(/\s+/g, "-")}.ics`,
        content: icsBuffer,
      },
    ],
  });

  if (error) {
    throw new Error(`Error al enviar email al visitante: ${error.message}`);
  }
}
