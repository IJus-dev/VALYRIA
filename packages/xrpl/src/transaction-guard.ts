export interface XRPLTransactionMeta {
  TransactionResult?: string;
}

export interface XRPLSubmitAndWaitLikeResponse {
  result?: {
    hash?: string;
    meta?: XRPLTransactionMeta;
    validated_ledger_index?: number;
  };
}

export function getTransactionResult(response: XRPLSubmitAndWaitLikeResponse): string | undefined {
  return response.result?.meta?.TransactionResult;
}

export function assertTesSuccess(response: XRPLSubmitAndWaitLikeResponse): {
  hash?: string;
  ledgerIndex?: number;
  transactionResult: "tesSUCCESS";
} {
  const transactionResult = getTransactionResult(response);

  if (transactionResult !== "tesSUCCESS") {
    throw new Error(
      `XRPL submission failed after submitAndWait. meta.TransactionResult=${transactionResult ?? "undefined"}`
    );
  }

  return {
    ...(typeof response.result?.hash === "string" ? { hash: response.result.hash } : {}),
    ...(typeof response.result?.validated_ledger_index === "number"
      ? { ledgerIndex: response.result.validated_ledger_index }
      : {}),
    transactionResult
  };
}
