import { redirect } from "next/navigation";

// Redirect principal e feito no middleware (edge, HTTP 307 real).
// Este fallback cobre o caso de acesso direto sem middleware.
export default function Home() {
  redirect("/dashboard");
}
