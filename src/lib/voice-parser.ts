/**
 * Parser de lenguaje natural para transacciones financieras por voz o texto libre.
 * Admite múltiples transacciones en una sola frase usando conectores ("y", ",", "también").
 * Ejemplo: "Almuerzo 12000 en efectivo y café 3500 con tarjeta"
 */

export interface ParsedVoiceTransaction {
  concept: string;
  amount: number;
  walletHint?: "cash" | "credit_card" | "bank" | "other";
  categoryHint?: string;
  rawSegment: string;
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Restaurantes y Cafeterías": [
    "almuerzo", "cena", "desayuno", "café", "restaurant", "comida",
    "hamburguesa", "pizza", "sushi", "cerveza", "bar", "snack"
  ],
  "Alimentación y Supermercado": [
    "super", "supermercado", "lider", "jumbo", "panadería", "frutas",
    "verduras", "mercado", "carnicería"
  ],
  "Transporte y Combustible": [
    "uber", "didi", "taxi", "metro", "bip", "micro", "bencina",
    "combustible", "estacionamiento", "peaje"
  ],
  "Vivienda y Servicios": [
    "luz", "agua", "gas", "internet", "arriendo", "gastos comunes", "netflix", "spotify"
  ],
  "Salud y Bienestar": [
    "farmacia", "doctor", "médico", "remedio", "dentista", "clínica"
  ],
};

const WALLET_KEYWORDS: Record<string, "cash" | "credit_card" | "bank"> = {
  efectivo: "cash",
  cash: "cash",
  monedas: "cash",
  billete: "cash",
  tarjeta: "credit_card",
  credito: "credit_card",
  crédito: "credit_card",
  debito: "bank",
  débito: "bank",
  banco: "bank",
  transferencia: "bank",
  cuenta: "bank",
};

export function parseVoiceInput(text: string): ParsedVoiceTransaction[] {
  if (!text || text.trim().length === 0) return [];

  // Dividir por conectores habituales: " y ", ", ", " también ", " ademas "
  const rawSegments = text
    .split(/\s+(?:y|también|tambien|ademas|además)\s+|,\s*/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const results: ParsedVoiceTransaction[] = [];

  for (const segment of rawSegments) {
    // 1. Extraer número / monto (ej: $12.000, 12000, 3500.50, 3.500)
    // Limpia símbolos de moneda y separadores de miles
    const amountMatch = segment.match(/(?:\$|clp|usd|eur)?\s*(\d+(?:[.,]\d+)*)/i);
    if (!amountMatch) continue;

    const rawNumberStr = amountMatch[1];
    // Normalizar separadores numéricos
    let normalizedNum = rawNumberStr;
    if (rawNumberStr.includes(".") && rawNumberStr.includes(",")) {
      // Formato 1.250,50
      normalizedNum = rawNumberStr.replace(/\./g, "").replace(",", ".");
    } else if (rawNumberStr.includes(".")) {
      // Podría ser 12.000 (miles) o 12.50 (decimales)
      const parts = rawNumberStr.split(".");
      if (parts[1]?.length === 3) {
        normalizedNum = rawNumberStr.replace(/\./g, ""); // Separador de miles
      }
    } else if (rawNumberStr.includes(",")) {
      const parts = rawNumberStr.split(",");
      if (parts[1]?.length === 3) {
        normalizedNum = rawNumberStr.replace(/,/g, "");
      } else {
        normalizedNum = rawNumberStr.replace(",", ".");
      }
    }

    const amount = parseFloat(normalizedNum);
    if (isNaN(amount) || amount <= 0) continue;

    // 2. Extraer billetera / método de pago
    let walletHint: "cash" | "credit_card" | "bank" | "other" = "cash";
    const segmentLower = segment.toLowerCase();
    for (const [kw, type] of Object.entries(WALLET_KEYWORDS)) {
      if (segmentLower.includes(kw)) {
        walletHint = type;
        break;
      }
    }

    // 3. Extraer concepto (eliminar monto y palabras de billetera)
    let concept = segment
      .replace(amountMatch[0], "")
      .replace(/\b(?:en|con|por|de|el|la|los|las|un|una)\b/gi, " ")
      .replace(/\b(?:efectivo|tarjeta|crédito|credito|débito|debito|banco|transferencia)\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!concept) {
      concept = "Gasto rápido";
    } else {
      // Capitalizar primera letra
      concept = concept.charAt(0).toUpperCase() + concept.slice(1);
    }

    // 4. Deducir categoría por palabras clave
    let categoryHint: string | undefined;
    const conceptLower = concept.toLowerCase();
    for (const [catName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some((kw) => conceptLower.includes(kw) || segmentLower.includes(kw))) {
        categoryHint = catName;
        break;
      }
    }

    results.push({
      concept,
      amount,
      walletHint,
      categoryHint,
      rawSegment: segment,
    });
  }

  return results;
}
