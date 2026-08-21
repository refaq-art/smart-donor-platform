import { round2 } from "./money";

/** يُعيد تاريخ اليوم نفسه من الشهر بعد إضافة n شهرًا، مع تثبيت اليوم على آخر
 * يوم صالح في الشهر الهدف إن لم يحتوِ على نفس رقم اليوم (مثال: 31 يناير + شهر
 * → 28/29 فبراير بدل تجاوز إلى مارس). يعمل بتوقيت UTC لتفادي أي انزياح بسبب
 * المنطقة الزمنية، لأن حقول التاريخ في النظام قيم "يوم" بلا وقت فعليًا. */
export function addMonthsClamped(date: Date, months: number): Date {
  const day = date.getUTCDate();
  const totalMonthIndex = date.getUTCMonth() + months;
  const year = date.getUTCFullYear() + Math.floor(totalMonthIndex / 12);
  const month = ((totalMonthIndex % 12) + 12) % 12;
  const lastDayOfTargetMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const clampedDay = Math.min(day, lastDayOfTargetMonth);
  return new Date(Date.UTC(year, month, clampedDay));
}

export type ScheduleInstallment = {
  number: number;
  dueDate: Date;
  amount: number;
};

/** يولّد جدول أقساط شهرية بحيث يكون مجموع كل الأقساط مساويًا تمامًا
 * لإجمالي المبلغ المطلوب (لا فقدان لأي هللة بسبب التقريب) — عبر وضع فرق
 * التقريب بالكامل في القسط الأخير. */
export function generateInstallmentSchedule(
  totalAmount: number,
  count: number,
  firstInstallmentDate: Date,
): ScheduleInstallment[] {
  if (count < 1) throw new Error("عدد الأقساط يجب أن يكون 1 على الأقل");

  const perInstallment = round2(totalAmount / count);
  const installments: ScheduleInstallment[] = [];
  let allocated = 0;

  for (let i = 1; i <= count; i++) {
    const dueDate = addMonthsClamped(firstInstallmentDate, i - 1);
    if (i < count) {
      installments.push({ number: i, dueDate, amount: perInstallment });
      allocated = round2(allocated + perInstallment);
    } else {
      installments.push({ number: i, dueDate, amount: round2(totalAmount - allocated) });
    }
  }

  return installments;
}

/** المهلة: تُمثَّل داخليًا بقسط واحد بقيمة الإجمالي، تاريخ استحقاقه = تاريخ
 * البداية + عدد الأشهر (بنفس منطق تثبيت آخر يوم صالح في الشهر). */
export function graceDueDate(startDate: Date, months: number): Date {
  return addMonthsClamped(startDate, months);
}
