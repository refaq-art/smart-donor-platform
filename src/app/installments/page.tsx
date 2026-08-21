import { redirect } from "next/navigation";
import { getLmSession, type LmSessionPayload } from "@/lib/lm/auth";
import { isLmSessionUserValid } from "@/lib/lm/authz";

export default async function InstallmentsRootPage() {
  const session = await getLmSession();
  if (session && (await isLmSessionUserValid(session as LmSessionPayload))) {
    redirect("/installments/dashboard");
  }
  redirect("/installments/login");
}
