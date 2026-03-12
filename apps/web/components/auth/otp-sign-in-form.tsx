"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function OtpSignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <Card tone="soft" className="p-5">
      <h3 className="text-2xl text-dusk">Entrar com OTP</h3>
      <p className="mt-2 body-copy">
        A sessão usa cookie seguro do Auth.js, com usuário e estado persistidos no banco.
      </p>

      <div className="mt-5 grid gap-4">
        <Input
          placeholder="operações@valyria.io"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Input
          placeholder="000000"
          value={code}
          onChange={(event) => setCode(event.target.value)}
        />
        <Button
          onClick={() => {
            startTransition(async () => {
              const result = await signIn("email-otp", {
                email,
                code,
                redirect: false
              });

              if (!result || result.error) {
                toast.error("Código inválido ou expirado.");
                return;
              }

              toast.success("Sessão autenticada.");
              router.refresh();
            });
          }}
          disabled={isPending || !email || !code}
        >
          {isPending ? "Autenticando..." : "Entrar"}
        </Button>

      </div>
    </Card>
  );
}
