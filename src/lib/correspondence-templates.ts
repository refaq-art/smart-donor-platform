import { formatDate, formatMoney } from "@/lib/utils";
import { CORRESPONDENCE_TYPES } from "@/lib/constants";

export type CorrespondenceType = keyof typeof CORRESPONDENCE_TYPES;

type OrgCtx = {
  name: string;
  delegateName?: string | null;
  delegateRole?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
};

type DonorCtx = { name: string; contactName?: string | null };

export function buildCorrespondence(
  type: CorrespondenceType,
  ctx: {
    organization: OrgCtx;
    donor: DonorCtx;
    applicationTitle: string;
    projectTitle?: string | null;
    amount?: number | null;
  }
): { subject: string; body: string } {
  const today = formatDate(new Date());
  const donorSalutation = ctx.donor.contactName ? `السادة/ ${ctx.donor.contactName} المحترم` : `السادة/ ${ctx.donor.name} المحترمين`;
  const signature = [
    ctx.organization.delegateName ? `${ctx.organization.delegateName}${ctx.organization.delegateRole ? ` — ${ctx.organization.delegateRole}` : ""}` : null,
    ctx.organization.name,
    ctx.organization.phone || null,
    ctx.organization.email || null,
  ]
    .filter(Boolean)
    .join("\n");

  if (type === "THANK_YOU") {
    return {
      subject: `خطاب شكر وتقدير — ${ctx.applicationTitle}`,
      body: `${donorSalutation}\n\nالتحية الطيبة وبعد،\n\nيسر ${ctx.organization.name} أن تتقدم لكم بجزيل الشكر والتقدير على دعمكم الكريم${
        ctx.projectTitle ? ` لمشروع "${ctx.projectTitle}"` : ""
      } ضمن طلب "${ctx.applicationTitle}"${ctx.amount ? `، بمبلغ إجمالي قدره ${formatMoney(ctx.amount)}` : ""}.\n\nإن دعمكم يمثل إسهامًا حقيقيًا في تحقيق الأثر المرجو للمستفيدين، ونؤكد التزامنا بتنفيذ المشروع وفق الخطة المتفق عليها وموافاتكم بالتقارير الدورية المطلوبة في مواعيدها.\n\nمتطلعين لاستمرار هذه الشراكة المثمرة.\n\nوتفضلوا بقبول فائق الاحترام والتقدير،\n\n${signature}\n${today}`,
    };
  }

  if (type === "ACCEPTANCE_ACK") {
    return {
      subject: `تأكيد استلام الموافقة على الدعم — ${ctx.applicationTitle}`,
      body: `${donorSalutation}\n\nالتحية الطيبة وبعد،\n\nنفيدكم بأن ${ctx.organization.name} قد استلمت إشعار موافقتكم الكريمة على دعم "${ctx.applicationTitle}"${
        ctx.projectTitle ? ` (مشروع "${ctx.projectTitle}")` : ""
      }${ctx.amount ? ` بمبلغ ${formatMoney(ctx.amount)}` : ""}.\n\nسنبدأ فور استلام الدعم بتنفيذ المشروع وفق الخطة والجدول الزمني المعتمدين، وسنلتزم بموافاتكم بالتقارير الدورية والمالية المطلوبة وفق شروطكم.\n\nشاكرين لكم ثقتكم، ونتطلع لتعاون مثمر ومستمر.\n\nوتفضلوا بقبول فائق الاحترام والتقدير،\n\n${signature}\n${today}`,
    };
  }

  return {
    subject: `مراسلة بخصوص — ${ctx.applicationTitle}`,
    body: `${donorSalutation}\n\nالتحية الطيبة وبعد،\n\n[الرجاء تحرير نص المراسلة]\n\nوتفضلوا بقبول فائق الاحترام والتقدير،\n\n${signature}\n${today}`,
  };
}
