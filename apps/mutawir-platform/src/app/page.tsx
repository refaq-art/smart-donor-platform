import { redirect } from "next/navigation";
import { getCurrentUser, roleHome } from "@/lib/auth";
import type { RoleValue } from "@/lib/constants";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect(roleHome(user.role as RoleValue));
  redirect("/login");
}
