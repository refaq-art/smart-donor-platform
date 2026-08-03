import { PageHeader } from "@/components/ui-bits";
import ProjectForm from "@/components/project-form";
import { createProjectAction } from "@/app/actions/projects";
import { getSession } from "@/lib/auth";
import { canEdit } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function NewProjectPage() {
  const session = await getSession();
  if (!canEdit(session?.role)) redirect("/projects");

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="إنشاء مشروع جديد" subtitle="عبّئ بيانات المشروع؛ يمكنك حفظه كمسودة والعودة لاحقًا" />
      <ProjectForm action={createProjectAction} submitLabel="حفظ المشروع" />
    </div>
  );
}
