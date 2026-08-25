import type { Sponsor } from "@/lib/types";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SponsorForm({
  action,
  sponsor,
}: {
  action: (formData: FormData) => void;
  sponsor?: Sponsor;
}) {
  return (
    <form action={action} className="max-w-xl space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 sm:col-span-1">
          <Label htmlFor="honorific">اللقب</Label>
          <Input id="honorific" name="honorific" defaultValue={sponsor?.honorific ?? "الأستاذ"} required />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <Label htmlFor="full_name">الاسم الكامل</Label>
          <Input id="full_name" name="full_name" defaultValue={sponsor?.full_name} required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">رقم الجوال (اختياري)</Label>
          <Input id="phone" name="phone" dir="ltr" defaultValue={sponsor?.phone ?? ""} />
        </div>
        <div>
          <Label htmlFor="email">البريد الإلكتروني (اختياري)</Label>
          <Input id="email" name="email" type="email" dir="ltr" defaultValue={sponsor?.email ?? ""} />
        </div>
      </div>

      <div>
        <Label htmlFor="sponsor_number">رقم الكافل</Label>
        <Input id="sponsor_number" name="sponsor_number" dir="ltr" defaultValue={sponsor?.sponsor_number ?? ""} />
      </div>

      <div>
        <Label htmlFor="notes">ملاحظات</Label>
        <Textarea id="notes" name="notes" defaultValue={sponsor?.notes ?? ""} />
      </div>

      <Button type="submit" size="lg">
        {sponsor ? "حفظ التعديلات" : "إضافة الكافل"}
      </Button>
    </form>
  );
}
