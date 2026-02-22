/**
 * Generación de Pases Digitales
 *
 * Apple PassKit (.pkpass) y Google Wallet (JWT save URL)
 * para pases digitales de reservas de visitantes.
 *
 * Ambas funciones son no-bloqueantes: devuelven null si las credenciales
 * necesarias no están configuradas en las variables de entorno.
 */

import { deflateSync } from "zlib";
import { format } from "date-fns";
import { es } from "date-fns/locale";

/** Datos mínimos necesarios para generar cualquier tipo de pase */
export interface PassData {
  reservationId: string;
  spotLabel: string;
  /** Fecha en formato YYYY-MM-DD */
  date: string;
  visitorName: string;
  visitorCompany: string;
  reservedByName: string;
  notes?: string | null;
}

// ─── Google Wallet ────────────────────────────────────────────

/**
 * Genera la URL de Google Wallet para añadir el pase.
 * Devuelve null si las credenciales no están configuradas.
 */
export async function generateGoogleWalletUrl(
  data: PassData
): Promise<string | null> {
  const serviceAccountRaw = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT;
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;

  if (!serviceAccountRaw || !issuerId) return null;

  try {
    const serviceAccount = JSON.parse(
      Buffer.from(serviceAccountRaw, "base64").toString("utf-8")
    ) as { client_email: string; private_key: string };

    const { sign } = await import("jsonwebtoken");

    const formattedDate = format(
      new Date(data.date + "T00:00:00"),
      "d 'de' MMMM 'de' yyyy",
      { locale: es }
    );

    const objectSuffix = data.reservationId.replace(/-/g, "");
    const objectId = `${issuerId}.${objectSuffix}`;
    const classId = `${issuerId}.parking-visitor-v1`;

    const payload = {
      iss: serviceAccount.client_email,
      aud: "google",
      typ: "savetowallet",
      iat: Math.floor(Date.now() / 1000),
      payload: {
        genericObjects: [
          {
            id: objectId,
            classId,
            genericType: "GENERIC_TYPE_UNSPECIFIED",
            hexBackgroundColor: "#1e40af",
            cardTitle: {
              defaultValue: { language: "es", value: "Aparcamiento" },
            },
            subheader: {
              defaultValue: { language: "es", value: "Visitante" },
            },
            header: {
              defaultValue: { language: "es", value: data.spotLabel },
            },
            textModulesData: [
              {
                id: "visitor_name",
                header: "Visitante",
                body: data.visitorName,
              },
              {
                id: "visitor_company",
                header: "Empresa",
                body: data.visitorCompany,
              },
              {
                id: "reservation_date",
                header: "Fecha",
                body: formattedDate,
              },
              ...(data.notes
                ? [{ id: "notes", header: "Notas", body: data.notes }]
                : []),
            ],
            barcode: {
              type: "QR_CODE",
              value: data.reservationId,
            },
          },
        ],
      },
    };

    const token = sign(payload, serviceAccount.private_key, {
      algorithm: "RS256",
    });

    return `https://pay.google.com/gp/v/save/${token}`;
  } catch (err) {
    console.error("Error al generar URL de Google Wallet:", err);
    return null;
  }
}

// ─── Apple Wallet ─────────────────────────────────────────────

/**
 * Genera un Buffer PNG de color sólido usando solo Node.js built-ins.
 * Usado para los iconos del pase de Apple Wallet sin dependencias externas.
 */
function createSolidColorPng(
  width: number,
  height: number,
  r: number,
  g: number,
  b: number
): Buffer {
  // Tabla CRC32
  const crcTable: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c;
  }

  const crc32 = (buf: Buffer): number => {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = (crcTable[(crc ^ buf[i]!) & 0xff] ?? 0) ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  };

  const chunk = (type: string, data: Buffer): Buffer => {
    const typeBuffer = Buffer.from(type);
    const crcData = Buffer.concat([typeBuffer, data]);
    const crcValue = crc32(crcData);
    const lenBuffer = Buffer.alloc(4);
    lenBuffer.writeUInt32BE(data.length, 0);
    const crcBuffer = Buffer.alloc(4);
    crcBuffer.writeUInt32BE(crcValue, 0);
    return Buffer.concat([lenBuffer, typeBuffer, data, crcBuffer]);
  };

  // Firma PNG
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // profundidad de bits
  ihdrData[9] = 2; // tipo de color: RGB
  ihdrData[10] = 0; // compresión
  ihdrData[11] = 0; // filtro
  ihdrData[12] = 0; // entrelazado
  const ihdrChunk = chunk("IHDR", ihdrData);

  // Datos de imagen: byte de filtro (0) + RGB por píxel
  const rowLength = 1 + width * 3;
  const rawData = Buffer.alloc(height * rowLength);
  for (let y = 0; y < height; y++) {
    rawData[y * rowLength] = 0; // sin filtro
    for (let x = 0; x < width; x++) {
      rawData[y * rowLength + 1 + x * 3] = r;
      rawData[y * rowLength + 2 + x * 3] = g;
      rawData[y * rowLength + 3 + x * 3] = b;
    }
  }
  const compressed = deflateSync(rawData);
  const idatChunk = chunk("IDAT", compressed);

  // IEND
  const iendChunk = chunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

/**
 * Genera un archivo .pkpass de Apple Wallet para la reserva de visitante.
 * Devuelve null si los certificados no están configurados.
 *
 * Env vars necesarias:
 *   APPLE_WALLET_WWDR          → Certificado WWDR de Apple (base64, PEM)
 *   APPLE_WALLET_CERT          → Certificado firmante (base64, PEM)
 *   APPLE_WALLET_KEY           → Clave privada (base64, PEM)
 *   APPLE_WALLET_TEAM_ID       → Team ID del Developer Account
 *   APPLE_WALLET_PASS_TYPE_ID  → Pass Type Identifier (ej: pass.com.empresa.parking)
 *   APPLE_WALLET_KEY_PASSPHRASE → Contraseña de la clave privada (opcional)
 */
export async function generateAppleWalletPass(
  data: PassData
): Promise<Buffer | null> {
  const wwdrBase64 = process.env.APPLE_WALLET_WWDR;
  const signerCertBase64 = process.env.APPLE_WALLET_CERT;
  const signerKeyBase64 = process.env.APPLE_WALLET_KEY;
  const teamId = process.env.APPLE_WALLET_TEAM_ID;
  const passTypeId = process.env.APPLE_WALLET_PASS_TYPE_ID;

  if (
    !wwdrBase64 ||
    !signerCertBase64 ||
    !signerKeyBase64 ||
    !teamId ||
    !passTypeId
  ) {
    return null;
  }

  try {
    const { PKPass } = await import("passkit-generator");

    const formattedDate = format(
      new Date(data.date + "T00:00:00"),
      "EEEE, d 'de' MMMM 'de' yyyy",
      { locale: es }
    );

    const passJson = {
      formatVersion: 1,
      passTypeIdentifier: passTypeId,
      serialNumber: data.reservationId,
      teamIdentifier: teamId,
      organizationName: "Sistema de Aparcamiento",
      description: "Plaza de aparcamiento para visitantes",
      logoText: "Parking",
      foregroundColor: "rgb(255, 255, 255)",
      backgroundColor: "rgb(30, 64, 175)",
      labelColor: "rgb(191, 219, 254)",
      generic: {
        primaryFields: [{ key: "spot", label: "Plaza", value: data.spotLabel }],
        secondaryFields: [
          { key: "visitor", label: "Visitante", value: data.visitorName },
          { key: "company", label: "Empresa", value: data.visitorCompany },
        ],
        auxiliaryFields: [
          { key: "date", label: "Fecha", value: formattedDate },
        ],
        backFields: [
          {
            key: "info",
            label: "Instrucciones",
            value:
              "Muestre este pase en la entrada del parking. Reservado por: " +
              data.reservedByName,
          },
          ...(data.notes
            ? [{ key: "notes", label: "Notas", value: data.notes }]
            : []),
        ],
      },
      barcodes: [
        {
          format: "PKBarcodeFormatQR",
          message: data.reservationId,
          messageEncoding: "iso-8859-1",
        },
      ],
    };

    // Iconos en azul corporativo (#1e40af = rgb(30,64,175))
    const icon1x = createSolidColorPng(29, 29, 30, 64, 175);
    const icon2x = createSolidColorPng(58, 58, 30, 64, 175);
    const icon3x = createSolidColorPng(87, 87, 30, 64, 175);
    const logo1x = createSolidColorPng(160, 50, 30, 64, 175);
    const logo2x = createSolidColorPng(320, 100, 30, 64, 175);

    const pass = new PKPass(
      {
        "pass.json": Buffer.from(JSON.stringify(passJson)),
        "icon.png": icon1x,
        "icon@2x.png": icon2x,
        "icon@3x.png": icon3x,
        "logo.png": logo1x,
        "logo@2x.png": logo2x,
      },
      {
        wwdr: Buffer.from(wwdrBase64, "base64"),
        signerCert: Buffer.from(signerCertBase64, "base64"),
        signerKey: Buffer.from(signerKeyBase64, "base64"),
        signerKeyPassphrase: process.env.APPLE_WALLET_KEY_PASSPHRASE,
      }
    );

    return pass.getAsBuffer();
  } catch (err) {
    console.error("Error al generar pase de Apple Wallet:", err);
    return null;
  }
}
