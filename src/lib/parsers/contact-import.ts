/**
 * Parsers para archivos de contactos.
 * Soporta:
 * - VCF (vCard 2.1, 3.0, 4.0) — el formato nativo de iOS/Android/macOS.
 * - CSV — el formato que exporta Google Contacts y la mayoria de CRMs.
 *
 * Retorna un array de ContactoImportado con nombre, telefono normalizado
 * y email opcional. Los contactos sin telefono se descartan.
 */

export interface ContactoImportado {
  nombre: string;
  telefono: string;
  email: string | null;
}

/** Detecta el formato del archivo segun las primeras lineas. */
export function detectarFormato(text: string): "vcf" | "csv" | "desconocido" {
  const trimmed = text.trimStart();
  if (trimmed.toUpperCase().startsWith("BEGIN:VCARD")) return "vcf";
  if (trimmed.split(/\r?\n/)[0]?.includes(",")) return "csv";
  return "desconocido";
}

/** Parsea un archivo VCF (vCard). Salta entradas sin telefono. */
export function parseVcf(text: string): ContactoImportado[] {
  const contactos: ContactoImportado[] = [];
  const cards = text.split(/(?=BEGIN:VCARD)/i);

  for (const card of cards) {
    if (!/BEGIN:VCARD/i.test(card)) continue;

    const nombre = extractVcfField(card, "FN") ?? deriveNameFromN(card);
    const telefonoRaw = pickVcfPhone(card);
    if (!nombre || !telefonoRaw) continue;

    const telefono = normalizarTelefono(telefonoRaw);
    if (!telefono) continue;

    const email = extractVcfField(card, "EMAIL");

    contactos.push({ nombre: nombre.trim(), telefono, email });
  }

  return contactos;
}

/** Parsea un CSV basico. Espera una primera fila con headers. */
export function parseCsv(text: string): ContactoImportado[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim());
  const idxNombre = findCol(headers, [
    "name",
    "full name",
    "nombre",
    "display name",
    "fn",
  ]);
  const idxNombreParts = idxNombre === -1
    ? {
        first: findCol(headers, ["first name", "given name", "nombre"]),
        last: findCol(headers, ["last name", "family name", "apellido"]),
      }
    : { first: -1, last: -1 };
  const idxTel = findCol(headers, [
    "mobile phone",
    "phone",
    "telefono",
    "teléfono",
    "tel",
    "cell",
    "mobile",
    "phone 1 - value",
  ]);
  const idxEmail = findCol(headers, ["e-mail", "email", "e-mail 1 - value", "mail"]);

  if (idxTel === -1) return [];

  const contactos: ContactoImportado[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const telRaw = cols[idxTel];
    if (!telRaw) continue;
    const telefono = normalizarTelefono(telRaw);
    if (!telefono) continue;

    let nombre: string;
    if (idxNombre !== -1) {
      nombre = cols[idxNombre]?.trim() ?? "";
    } else {
      const first = cols[idxNombreParts.first]?.trim() ?? "";
      const last = cols[idxNombreParts.last]?.trim() ?? "";
      nombre = `${first} ${last}`.trim();
    }
    if (!nombre) continue;

    const email = idxEmail !== -1 ? cols[idxEmail]?.trim() || null : null;

    contactos.push({ nombre, telefono, email });
  }

  return contactos;
}

export function parseContactFile(text: string): ContactoImportado[] {
  const formato = detectarFormato(text);
  if (formato === "vcf") return parseVcf(text);
  if (formato === "csv") return parseCsv(text);
  return [];
}

// =====================================================
// Helpers
// =====================================================

function extractVcfField(card: string, field: string): string | null {
  // Soporta lineas con parametros: TEL;CELL;PREF:+549...
  // Y lineas con encoding quoted-printable: CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:=xx=
  const lines = card.split(/\r?\n/);
  const re = new RegExp(`^${field}(?:;[^:]*)?:(.*)$`, "i");
  for (const line of lines) {
    const m = line.match(re);
    if (m) {
      let value = m[1].trim();
      value = decodeQuotedPrintable(value);
      value = unescapeVcard(value);
      return value || null;
    }
  }
  return null;
}

function deriveNameFromN(card: string): string | null {
  // N:Apellido;Nombre;SegundoNombre;Prefijo;Sufijo
  // o N:;Solo Nombre;;;
  const n = extractVcfField(card, "N");
  if (!n) return null;
  const parts = n.split(";").map((s) => s.trim()).filter(Boolean);
  // Si el formato es Apellido,Nombre → damos vuelta
  if (parts.length === 2) return `${parts[1]} ${parts[0]}`.trim();
  return parts.join(" ");
}

function pickVcfPhone(card: string): string | null {
  // Prioridad: CELL, MOBILE, MAIN, cualquier TEL
  const lines = card.split(/\r?\n/);
  const telRe = /^TEL([^:]*):(.*)$/i;
  const candidates: { priority: number; value: string }[] = [];
  let priority = 100;
  for (const line of lines) {
    const m = line.match(telRe);
    if (m) {
      const params = m[1].toUpperCase();
      const value = m[2].trim();
      let p = priority++;
      if (params.includes("CELL") || params.includes("MOBILE")) p = 1;
      else if (params.includes("HOME")) p = 2;
      else if (params.includes("WORK")) p = 3;
      else if (params.includes("MAIN")) p = 0;
      else if (params.includes("PREF")) p -= 1; // preferido
      const cleaned = value.split(":")[0].trim();
      if (cleaned) candidates.push({ priority: p, value: cleaned });
    }
  }
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => a.priority - b.priority);
  return candidates[0].value;
}

function parseCsvLine(line: string): string[] {
  // Parser CSV simple: respeta comillas dobles y comas escapadas con "".
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        cur += c;
      }
    } else {
      if (c === ",") {
        result.push(cur);
        cur = "";
      } else if (c === '"' && cur === "") {
        inQuotes = true;
      } else {
        cur += c;
      }
    }
  }
  result.push(cur);
  return result;
}

function findCol(headers: string[], candidates: string[]): number {
  // Match exacto, luego parcial.
  for (const c of candidates) {
    const idx = headers.indexOf(c);
    if (idx !== -1) return idx;
  }
  for (const c of candidates) {
    const idx = headers.findIndex((h) => h.includes(c));
    if (idx !== -1) return idx;
  }
  return -1;
}

/**
 * Normaliza un telefono a formato internacional +549XXXXXXXXXX cuando
 * es posible. Devuelve null si no es un telefono valido.
 *
 * Reglas Argentina (las mas comunes):
 * - 11XXXXXXXX (sin 15) → +549 + resto
 * - 15XXXXXXXX (con 15) → +549 + resto sin el 15
 * - +54 9 XX... → +549XX...
 * - +549XXXXXXXXXX → 그대로
 * - 54 9 XX... (sin +) → +549XX...
 * - XXX-XXXX-XXXX (formato EE.UU.) → +1XXXXXXXXXX (no tocamos, se devuelve tal cual)
 */
export function normalizarTelefono(raw: string): string | null {
  if (!raw) return null;
  // Quitar extension tipo "ext 123" o "x123"
  let s = raw.replace(/\s*(ext\.?|x)\s*\d+/i, "").trim();
  // Quitar todo lo que no sea + o digitos
  s = s.replace(/[^\d+]/g, "");
  if (!s) return null;

  // Caso 1: ya tiene +54...
  if (s.startsWith("+549") && s.length >= 13 && s.length <= 14) return s;
  if (s.startsWith("+54") && !s.startsWith("+549")) {
    // +54 seguido de 9 → +549
    if (s[3] === "9") return "+" + s.slice(4);
    // +54 sin 9 (linea fija) → mantener
    return s;
  }
  if (s.startsWith("+")) return s; // otro pais, mantener

  // Caso 2: empieza con 549... (con o sin + lo descarte arriba)
  if (s.startsWith("549") && s.length >= 12 && s.length <= 13) {
    return "+" + s;
  }
  if (s.startsWith("54") && !s.startsWith("549")) {
    if (s[2] === "9") return "+" + s.slice(3);
    return "+" + s;
  }

  // Caso 3: empieza con 15 (formato viejo con 0 + 15 + numero)
  if (s.startsWith("15") && s.length === 12) {
    return "+549" + s.slice(2);
  }
  if (s.startsWith("0") && s.startsWith("015")) {
    return "+549" + s.slice(3);
  }
  if (s.startsWith("0") && s.length === 11) {
    // 0 + codigo de area + numero (ej: 011XXXXXXXXX)
    return "+549" + s.slice(1);
  }

  // Caso 4: empieza con 9 (celular argentino sin prefijo)
  if (s.startsWith("9") && s.length === 11) {
    return "+54" + s;
  }

  // Caso 5: 10 digitos (numero local sin 0 ni 15)
  if (s.length === 10) {
    return "+549" + s;
  }
  if (s.length === 8) {
    // Numero local corto (ej: 4251234) — no podemos inferir codigo de area
    // Devolvemos tal cual para que el user lo arregle
    return s;
  }

  // Default: devolver como esta si parece valido
  if (s.length >= 8) return s;
  return null;
}

function decodeQuotedPrintable(value: string): string {
  if (!value.includes("=")) return value;
  try {
    // Quoted-printable: =XX son bytes hex, = al final es soft line break
    const cleaned = value.replace(/=\r?\n/g, "").replace(/=([A-Fa-f0-9]{2})/g, (_, h) =>
      String.fromCharCode(parseInt(h, 16))
    );
    // Intentar decoding a UTF-8 (los bytes decoded son latin1)
    return Buffer.from(cleaned, "latin1").toString("utf8");
  } catch {
    return value;
  }
}

function unescapeVcard(value: string): string {
  return value
    .replace(/\\n/g, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}
