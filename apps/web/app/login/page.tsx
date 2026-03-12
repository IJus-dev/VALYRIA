import { auth } from "@/auth";
import { CredentialAcceptancePanel } from "@/components/auth/credential-acceptance-panel";
import { OtpRequestForm } from "@/components/auth/otp-request-form";
import { OtpSignInForm } from "@/components/auth/otp-sign-in-form";
import { WalletLoginForm } from "@/components/auth/wallet-login-form";
import { WalletLinkPanel } from "@/components/auth/wallet-link-panel";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";

export default async function LoginPage() {
  const session = await auth();

  return (
    <main className="grid gap-section pt-8 lg:grid-cols-[0.95fr_1.05fr]">
      <Card className="p-8">
        <Badge>XRPL-native auth</Badge>
        <SectionHeading
          className="mt-5"
          heading="Conecte sua wallet XRPL para entrar."
          titleTag="h1"
          description="Cole a seed da testnet, assine o challenge e entre. A seed nunca sai do navegador."
        />

        <div className="mt-8 grid gap-3">
          {[
            { step: "1", label: "Challenge", detail: "Desafio único e expirável" },
            { step: "2", label: "Assinatura", detail: "Prova de posse da wallet" },
            { step: "3", label: "Sessão JWT", detail: "Cookie seguro, sem seed no servidor" },
          ].map((item) => (
            <div key={item.step} className="flex items-center gap-4 rounded-tile border border-line/45 bg-paper/88 px-5 py-4">
              <span className="text-2xl text-dusk/40">{item.step}</span>
              <div>
                <span className="text-sm font-medium text-dusk">{item.label}</span>
                <span className="ml-2 text-sm text-ink/60">{item.detail}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex flex-col gap-6">
        <Card className="p-8">
          <SectionHeading
            eyebrow="LOGIN PRINCIPAL"
            heading="Entrar com wallet XRPL."
          />
          <div className="mt-6">
            <WalletLoginForm />
          </div>
        </Card>

        {session?.user ? (
          <>
            <WalletLinkPanel session={session} />
            <CredentialAcceptancePanel session={session} />
          </>
        ) : null}

        <Card tone="outline" className="p-6">
          <SectionHeading
            eyebrow="ALTERNATIVO"
            heading="Login por email + OTP"
            description="Método alternativo para acesso sem wallet."
          />
          <div className="mt-5 grid gap-4">
            <OtpRequestForm />
            <OtpSignInForm />
          </div>
        </Card>

        <div className="rounded-tile border border-dashed border-clay/60 bg-clay/5 p-5">
          <div className="label-caps">Sessão atual</div>
          <p className="mt-3 body-copy">
            {session?.user
              ? `${session.user.walletAddress ?? session.user.email ?? session.user.id} (${session.user.state ?? "unknown"})`
              : "Nenhuma sessão ativa."}
          </p>
          {session?.user ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {session.user.roles?.map((role) => (
                <Badge key={role} variant="outline">{role}</Badge>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
