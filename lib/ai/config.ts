// Configuracion del modulo de redes e IA. Todo se lee de variables de entorno
// para que local, testing y produccion puedan tener valores distintos.
//
//   FEATURE_SOCIAL=true          -> prende el modulo (apagado si falta)
//   ANTHROPIC_API_KEY=...        -> key del proveedor (solo servidor)
//   AI_MODEL=claude-sonnet-5-5   -> modelo a usar
//   AI_MONTHLY_BUDGET_USD=10     -> tope de gasto mensual; al superarlo se corta
//   AI_PRICE_INPUT_PER_MTOK=3    -> USD por millon de tokens de entrada (para el tope)
//   AI_PRICE_OUTPUT_PER_MTOK=15  -> USD por millon de tokens de salida (para el tope)

export function isSocialEnabled(): boolean {
  return process.env.FEATURE_SOCIAL === "true";
}

function num(name: string, fallback: number): number {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

export const aiConfig = {
  get model() {
    return process.env.AI_MODEL || process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";
  },
  get monthlyBudgetUsd() {
    return num("AI_MONTHLY_BUDGET_USD", 10);
  },
  get priceInputPerMTok() {
    return num("AI_PRICE_INPUT_PER_MTOK", 3);
  },
  get priceOutputPerMTok() {
    return num("AI_PRICE_OUTPUT_PER_MTOK", 15);
  },
};
