import { signIn } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: { error?: string; redirect?: string };
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-forest-900 px-6">
      <div className="w-full max-w-sm rounded-xl2 bg-white p-8 shadow-soft">
        <div className="mb-6 text-center">
          <span className="mb-2 inline-block rounded-full bg-forest-100 px-4 py-1 text-xs font-bold text-forest-600">
            أثر كفالتك
          </span>
          <h1 className="text-xl font-extrabold text-forest-900">لوحة الإدارة</h1>
        </div>

        {searchParams.error ? (
          <div className="mb-4 rounded-xl2 bg-red-50 px-4 py-3 text-sm text-red-700">
            {searchParams.error}
          </div>
        ) : null}

        <form action={signIn} className="space-y-4">
          <input type="hidden" name="redirectTo" value={searchParams.redirect || "/admin"} />
          <div>
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input id="email" name="email" type="email" required dir="ltr" placeholder="admin@example.com" />
          </div>
          <div>
            <Label htmlFor="password">كلمة المرور</Label>
            <Input id="password" name="password" type="password" required dir="ltr" placeholder="••••••••" />
          </div>
          <Button type="submit" className="w-full" size="lg">
            تسجيل الدخول
          </Button>
        </form>
      </div>
    </div>
  );
}
