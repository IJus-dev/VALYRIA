export type ResultCategory = "success" | "retryable" | "terminal";

const RETRYABLE_RESULTS = new Set([
  "terPRE_SEQ",
  "terQUEUED",
  "terRETRY",
  "tefPAST_SEQ",
  "tefNO_AUTH_REQUIRED",
  "tecNO_PERMISSION",
]);

const TERMINAL_TEC = new Set([
  "tecUNFUNDED_OFFER",
  "tecUNFUNDED_PAYMENT",
  "tecNO_DST",
  "tecNO_DST_INSUF_XRP",
  "tecKILLED",
]);

export function classifyTransactionResult(result: string): ResultCategory {
  if (result === "tesSUCCESS") return "success";
  if (RETRYABLE_RESULTS.has(result)) return "retryable";
  if (result.startsWith("tem")) return "terminal";
  if (TERMINAL_TEC.has(result)) return "terminal";
  if (result.startsWith("ter")) return "retryable";
  if (result.startsWith("tef")) return "retryable";
  return "terminal";
}
