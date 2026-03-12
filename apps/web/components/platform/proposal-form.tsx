"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { proposalCreateSchema, type ProposalCreateInput } from "@/lib/schemas/proposal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useLocale } from "@/lib/locale-context";

interface ProposalFormProps {
  users: Array<{ id: string; name: string | null; email: string | null }>;
}

export function ProposalForm({ users }: ProposalFormProps) {
  const { t } = useLocale();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProposalCreateInput>({
    resolver: zodResolver(proposalCreateSchema),
    defaultValues: {
      code: "",
      title: "",
      summary: "",
      authorId: users[0]?.id ?? "",
    },
  });

  async function onSubmit(data: ProposalCreateInput) {
    try {
      const response = await fetch("/api/backoffice/governance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.message ?? t("proposalForm.createFailed"));
        return;
      }

      toast.success(t("proposalForm.created"));
      reset();
      router.refresh();
    } catch {
      toast.error(t("proposalForm.networkError"));
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl text-dusk">{t("proposalForm.heading")}</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 grid gap-3">
        <div>
          <Input placeholder={t("proposalForm.codePlaceholder")} {...register("code")} />
          {errors.code && <p className="mt-1 text-xs text-red-600">{errors.code.message}</p>}
        </div>

        <div>
          <Input placeholder={t("proposalForm.titlePlaceholder")} {...register("title")} />
          {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
        </div>

        <div>
          <Textarea placeholder={t("proposalForm.summaryPlaceholder")} rows={3} {...register("summary")} />
          {errors.summary && <p className="mt-1 text-xs text-red-600">{errors.summary.message}</p>}
        </div>

        <div>
          <Select {...register("authorId")}>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name ?? user.email ?? user.id}
              </option>
            ))}
          </Select>
          {errors.authorId && <p className="mt-1 text-xs text-red-600">{errors.authorId.message}</p>}
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t("proposalForm.creating") : t("proposalForm.create")}
        </Button>
      </form>
    </Card>
  );
}
