/**
 * Plantilla de Email: Confirmación de Reserva de Visitante
 *
 * Enviada al visitante externo al confirmar su plaza de aparcamiento.
 * Incluye enlace a Google Wallet; el .pkpass de Apple Wallet va adjunto.
 */

import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";

export interface VisitorReservationEmailProps {
  visitorName: string;
  visitorCompany: string;
  spotLabel: string;
  /** Fecha formateada en español, ej: "lunes, 21 de febrero de 2026" */
  date: string;
  reservedByName: string;
  notes?: string | null;
  googleWalletUrl?: string | null;
}

export function VisitorReservationEmail({
  visitorName,
  visitorCompany,
  spotLabel,
  date,
  reservedByName,
  notes,
  googleWalletUrl,
}: VisitorReservationEmailProps) {
  return (
    <Html lang="es">
      <Head />
      <Preview>
        Plaza {spotLabel} reservada — {date}
      </Preview>
      <Body style={s.body}>
        <Container style={s.container}>
          {/* Cabecera */}
          <Section style={s.header}>
            <Heading style={s.logo}>P Parking</Heading>
            <Text style={s.tagline}>Sistema de Gestión de Aparcamiento</Text>
          </Section>

          {/* Contenido principal */}
          <Section style={s.main}>
            <Heading as="h2" style={s.title}>
              Tu plaza está confirmada
            </Heading>
            <Text style={s.greeting}>
              Hola, <strong>{visitorName}</strong>
            </Text>
            <Text style={s.text}>
              <strong>{reservedByName}</strong> ha reservado una plaza de
              aparcamiento para tu próxima visita a{" "}
              <strong>{visitorCompany}</strong>.
            </Text>

            {/* Tarjeta de reserva */}
            <Section style={s.card}>
              <Row>
                <Column style={s.cardCol}>
                  <Text style={s.cardLabel}>PLAZA</Text>
                  <Text style={s.cardSpot}>{spotLabel}</Text>
                </Column>
                <Column style={s.cardCol}>
                  <Text style={s.cardLabel}>FECHA</Text>
                  <Text style={s.cardDate}>{date}</Text>
                </Column>
              </Row>
            </Section>

            {notes && (
              <Section style={s.notes}>
                <Text style={s.notesLabel}>NOTAS</Text>
                <Text style={s.notesText}>{notes}</Text>
              </Section>
            )}

            <Text style={s.instruction}>
              Muestre este correo o su pase digital en la entrada del parking.
            </Text>

            {/* Botones de wallet */}
            <Section style={s.walletSection}>
              {googleWalletUrl && (
                <>
                  <Text style={s.walletTitle}>
                    Añade tu pase a la cartera digital
                  </Text>
                  <Button href={googleWalletUrl} style={s.googleBtn}>
                    Añadir a Google Wallet
                  </Button>
                </>
              )}
              <Text style={s.appleNote}>
                El pase de Apple Wallet está adjunto a este correo (.pkpass)
              </Text>
            </Section>
          </Section>

          <Hr style={s.hr} />

          {/* Pie */}
          <Section style={s.footer}>
            <Text style={s.footerText}>
              Si tienes alguna duda, contacta con{" "}
              <strong>{reservedByName}</strong>.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ─── Estilos inline ───────────────────────────────────────────

const s = {
  body: {
    backgroundColor: "#f1f5f9",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    margin: "0",
    padding: "0",
  },
  container: {
    maxWidth: "560px",
    margin: "32px auto",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    overflow: "hidden" as const,
  },
  header: {
    backgroundColor: "#1e40af",
    padding: "32px 40px",
    textAlign: "center" as const,
  },
  logo: {
    color: "#ffffff",
    fontSize: "26px",
    fontWeight: "800",
    margin: "0 0 4px",
    letterSpacing: "-0.5px",
  },
  tagline: {
    color: "rgba(255,255,255,0.7)",
    fontSize: "13px",
    margin: "0",
  },
  main: {
    padding: "36px 40px 28px",
  },
  title: {
    color: "#0f172a",
    fontSize: "22px",
    fontWeight: "700",
    margin: "0 0 20px",
  },
  greeting: {
    color: "#334155",
    fontSize: "16px",
    margin: "0 0 8px",
  },
  text: {
    color: "#475569",
    fontSize: "15px",
    lineHeight: "1.6",
    margin: "0 0 24px",
  },
  card: {
    backgroundColor: "#eff6ff",
    borderRadius: "10px",
    padding: "20px 24px",
    marginBottom: "20px",
    border: "1px solid #bfdbfe",
  },
  cardCol: {
    width: "50%",
  },
  cardLabel: {
    color: "#6b7280",
    fontSize: "10px",
    fontWeight: "700",
    letterSpacing: "0.1em",
    margin: "0 0 6px",
    textTransform: "uppercase" as const,
  },
  cardSpot: {
    color: "#1d4ed8",
    fontSize: "36px",
    fontWeight: "800",
    margin: "0",
    lineHeight: "1",
  },
  cardDate: {
    color: "#1d4ed8",
    fontSize: "14px",
    fontWeight: "600",
    margin: "0",
    lineHeight: "1.5",
  },
  notes: {
    backgroundColor: "#f8fafc",
    borderLeft: "3px solid #94a3b8",
    padding: "12px 16px",
    marginBottom: "20px",
    borderRadius: "0 6px 6px 0",
  },
  notesLabel: {
    color: "#64748b",
    fontSize: "10px",
    fontWeight: "700",
    margin: "0 0 4px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
  },
  notesText: {
    color: "#374151",
    fontSize: "14px",
    margin: "0",
    lineHeight: "1.5",
  },
  instruction: {
    color: "#64748b",
    fontSize: "14px",
    fontStyle: "italic",
    margin: "0 0 20px",
  },
  walletSection: {
    textAlign: "center" as const,
    padding: "8px 0 16px",
  },
  walletTitle: {
    color: "#374151",
    fontSize: "14px",
    fontWeight: "600",
    margin: "0 0 12px",
  },
  googleBtn: {
    backgroundColor: "#1a73e8",
    color: "#ffffff",
    padding: "12px 28px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    textDecoration: "none",
    display: "inline-block",
    margin: "0 auto 12px",
  },
  appleNote: {
    color: "#94a3b8",
    fontSize: "12px",
    margin: "8px 0 0",
    textAlign: "center" as const,
  },
  hr: {
    borderColor: "#e2e8f0",
    margin: "0",
  },
  footer: {
    padding: "20px 40px",
    backgroundColor: "#f8fafc",
  },
  footerText: {
    color: "#94a3b8",
    fontSize: "13px",
    margin: "0",
    textAlign: "center" as const,
  },
};
