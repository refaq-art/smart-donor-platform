/**
 * طبقة إرسال البريد لاستعادة كلمة المرور.
 * بدون RESEND_API_KEY: لا يُرسل بريد فعلي — تُطبع رسالة في الطرفية ويُعاد رابط
 * الاستعادة مباشرة إلى المتصل (devMode) ليعرضه على الشاشة، مناسب للتطوير والتجربة
 * فورًا دون أي حساب خارجي. مع ضبط المفتاح: يُرسل بريد فعلي عبر Resend (Free Tier).
 */
export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string
): Promise<{ devMode: boolean; resetUrl?: string }> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`[استعادة كلمة المرور] رابط الاستعادة لـ ${email}: ${resetUrl}`);
    return { devMode: true, resetUrl };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
        to: email,
        subject: "استعادة كلمة المرور - منصة الدورات",
        html: `
          <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; text-align: right;">
            <h2>استعادة كلمة المرور</h2>
            <p>وصلنا طلب لاستعادة كلمة المرور الخاصة بحسابك. اضغط على الرابط التالي لتعيين كلمة مرور جديدة:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <p>إن لم تطلب ذلك، يمكنك تجاهل هذه الرسالة بأمان. صلاحية الرابط ساعة واحدة.</p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      console.error("فشل إرسال بريد الاستعادة عبر Resend:", await response.text());
      return { devMode: true, resetUrl };
    }

    return { devMode: false };
  } catch (error) {
    console.error("خطأ أثناء إرسال بريد الاستعادة:", error);
    return { devMode: true, resetUrl };
  }
}
