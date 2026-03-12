export interface BackofficeSuccess<T> {
  ok: true;
  payload: T;
}

export interface BackofficeFailure {
  ok: false;
  message: string;
}

function getErrorMessage(payload: unknown): string {
  if (payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string") {
    return payload.message;
  }

  return "Falha ao executar a operação.";
}

export async function postBackoffice<T>(
  path: string,
  body: Record<string, unknown>
): Promise<BackofficeSuccess<T> | BackofficeFailure> {
  const response = await fetch(`/api/backoffice/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  let payload: unknown = null;

  try {
    payload = (await response.json()) as unknown;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    return {
      ok: false,
      message: getErrorMessage(payload)
    };
  }

  return {
    ok: true,
    payload: payload as T
  };
}
