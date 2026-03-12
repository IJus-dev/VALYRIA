"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/lib/locale-context";

export function OtpSignInForm() {
  const { t } = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <Card tone="soft" className="p-5">
      <h3 className="text-2xl text-dusk">{t("otpSignIn.heading")}</h3>
      <p className="mt-2 body-copy">
        {t("otpSignIn.desc")}
      </p>

      <div className="mt-5 grid gap-4">
        <Input
          placeholder={t("otpSignIn.emailPlaceholder")}
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
          {isPending ? t("otpSignIn.authenticating") : t("otpSignIn.signIn")}
        </Button>

      </div>
    </Card>
  );
}
