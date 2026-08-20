"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import { enrollAction, cancelEnrollmentAction } from "@/app/actions/enrollments";
import { SubmitButton } from "@/components/submit-button";
import { FormMessage } from "@/components/ui";
import type { FormState } from "@/app/actions/auth";
import type { RegistrationState } from "@/lib/course-status";
import { REGISTRATION_STATE_LABELS } from "@/lib/course-status";

export function EnrollButton({
  courseId,
  enrollmentId,
  state,
  isLoggedIn,
  loginNext,
}: {
  courseId: string;
  enrollmentId?: string;
  state: RegistrationState;
  isLoggedIn: boolean;
  loginNext: string;
}) {
  const [enrollState, enrollFormAction] = useFormState<FormState, FormData>(enrollAction, null);
  const [cancelState, cancelFormAction] = useFormState<FormState, FormData>(
    cancelEnrollmentAction,
    null
  );

  if (!isLoggedIn) {
    return (
      <div>
        <Link
          href={`/login?next=${encodeURIComponent(loginNext)}`}
          className="btn-primary w-full py-3 text-base"
        >
          سجّل دخولك للتسجيل في الدورة
        </Link>
      </div>
    );
  }

  if (state === "ALREADY_ENROLLED") {
    return (
      <div className="space-y-3">
        <div className="btn-secondary w-full cursor-default py-3 text-base !text-emerald-700">
          أنت مسجَّل في هذه الدورة ✓
        </div>
        {cancelState?.error && <FormMessage type="error" message={cancelState.error} />}
        {cancelState?.success && <FormMessage type="success" message={cancelState.success} />}
        {enrollmentId && !cancelState?.success && (
          <form
            action={cancelFormAction}
            onSubmit={(e) => {
              if (!confirm("هل أنت متأكد من إلغاء تسجيلك في هذه الدورة؟")) {
                e.preventDefault();
              }
            }}
          >
            <input type="hidden" name="enrollmentId" value={enrollmentId} />
            <button type="submit" className="w-full text-center text-sm font-bold text-red-600 hover:underline">
              إلغاء التسجيل
            </button>
          </form>
        )}
      </div>
    );
  }

  if (state !== "OPEN") {
    return (
      <div className="btn-secondary w-full cursor-not-allowed py-3 text-base opacity-70">
        {REGISTRATION_STATE_LABELS[state]}
      </div>
    );
  }

  return (
    <div>
      <form action={enrollFormAction}>
        <input type="hidden" name="courseId" value={courseId} />
        <SubmitButton pendingLabel="جارٍ التسجيل..." className="py-3 text-base">
          سجّل الآن
        </SubmitButton>
      </form>
      {enrollState?.error && <div className="mt-3"><FormMessage type="error" message={enrollState.error} /></div>}
      {enrollState?.success && <div className="mt-3"><FormMessage type="success" message={enrollState.success} /></div>}
    </div>
  );
}
