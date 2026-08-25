export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-beige-light px-6 text-center">
      <h1 className="text-3xl font-extrabold text-forest-800">الصفحة غير موجودة</h1>
      <p className="mt-3 max-w-sm text-forest-500">
        الرابط الذي فتحته غير صحيح أو لم يعد متاحًا. تأكد من الرابط الذي وصلك من الجمعية.
      </p>
    </div>
  );
}
