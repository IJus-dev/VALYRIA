import { auth } from "@/auth";
import { CredentialAcceptancePanel } from "@/components/auth/credential-acceptance-panel";
import { OtpRequestForm } from "@/components/auth/otp-request-form";
import { OtpSignInForm } from "@/components/auth/otp-sign-in-form";
import { WalletLoginForm } from "@/components/auth/wallet-login-form";
import { WalletLinkPanel } from "@/components/auth/wallet-link-panel";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { getLocale } from "@/lib/get-locale";
import { getWebDictionary } from "@valyria/i18n/web";

export default async function LoginPage() {
  const locale = getLocale();
  const dict = getWebDictionary(locale);
  const t = (key: string) => dict[key] ?? key;

  const session = await auth();

  const steps = [
    { step: "1", label: t("login.step.challenge"), detail: t("login.step.challengeDesc") },
    { step: "2", label: t("login.step.signature"), detail: t("login.step.signatureDesc") },
    { step: "3", label: t("login.step.session"), detail: t("login.step.sessionDesc") },
  ];

  return (
    <main className="grid gap-section pt-8 lg:grid-cols-[0.95fr_1.05fr]">
      <Card className="p-8">
        <Badge>{t("login.badge")}</Badge>
        <SectionHeading
          className="mt-5"
          heading={t("login.heading")}
          titleTag="h1"
          description={t("login.desc")}
        />

        <div className="mt-8 grid gap-3">
          {steps.map((item) => (
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
            eyebrow={t("login.mainLogin.eyebrow")}
            heading={t("login.mainLogin.heading")}
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
            eyebrow={t("login.altLogin.eyebrow")}
            heading={t("login.altLogin.heading")}
            description={t("login.altLogin.desc")}
          />
          <div className="mt-5 grid gap-4">
            <OtpRequestForm />
            <OtpSignInForm />
          </div>
        </Card>

        <div className="rounded-tile border border-dashed border-clay/60 bg-clay/5 p-5">
          <div className="label-caps">{t("login.currentSession")}</div>
          <p className="mt-3 body-copy">
            {session?.user
              ? `${session.user.walletAddress ?? session.user.email ?? session.user.id} (${session.user.state ?? "unknown"})`
              : t("login.noActiveSession")}
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
