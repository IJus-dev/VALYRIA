"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Eyebrow } from "@/components/ui/eyebrow";

export function OtpRequestForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <Card tone="soft" className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-2xl text-dusk">Solicitar OTP</h3>
          <p className="mt-2 body-copy">Fluxo inicial do app auth com TTL de 10 minutos e rate limiting.</p>
        </div>
        <Badge variant="outline">Auth.js</Badge>
      </div>

      <div className="mt-5 grid gap-4">
        <Input
          placeholder="Nome da mesa ou cooperativa"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Input
          placeholder="operações@valyria.io"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Button
          onClick={() => {
            startTransition(async () => {
              setPreviewCode(null);

              const response = await fetch("/api/auth/request-otp", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  email,
                  ...(name ? { name } : {})
                })
              });

              const payload = (await response.json()) as {
                message?: string;
                expiresInSeconds?: number;
                previewCode?: string;
              };

              if (!response.ok) {
                toast.error(payload.message ?? "Falha ao emitir OTP.");
                return;
              }

              toast.success(`OTP emitido com sucesso. TTL ${payload.expiresInSeconds ?? 0}s.`);
              setPreviewCode(payload.previewCode ?? null);
            });
          }}
          disabled={isPending || !email}
        >
          {isPending ? "Emitindo..." : "Emitir OTP"}
        </Button>

        {previewCode ? (
          <div className="rounded-tile border border-dashed border-clay/60 bg-clay/6 p-4">
            <Eyebrow tone="clay" className="tracking-eyebrow">
              Preview dev
            </Eyebrow>
            <div className="mt-2 font-mono text-xl text-dusk">{previewCode}</div>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
