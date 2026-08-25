import { Plus, Trash2 } from "lucide-react";
import type { WizardState } from "@/lib/wizard-types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function StepNumbers({
  state,
  setState,
}: {
  state: WizardState;
  setState: (updater: (s: WizardState) => WizardState) => void;
}) {
  return (
    <div className="space-y-10">
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-forest-500">أرقام الأثر (Animated Counters)</h3>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              setState((s) => ({
                ...s,
                metrics: [...s.metrics, { metric_key: "custom", metric_label: "", metric_value: 0, metric_unit: "" }],
              }))
            }
          >
            <Plus className="h-3.5 w-3.5" /> إضافة رقم
          </Button>
        </div>
        <div className="space-y-2">
          {state.metrics.map((m, i) => (
            <div key={i} className="grid grid-cols-12 gap-2">
              <Input
                className="col-span-5"
                placeholder="التسمية (مثال: أشهر الكفالة)"
                value={m.metric_label}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    metrics: s.metrics.map((x, xi) => (xi === i ? { ...x, metric_label: e.target.value } : x)),
                  }))
                }
              />
              <Input
                className="col-span-3"
                type="number"
                placeholder="القيمة"
                value={m.metric_value}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    metrics: s.metrics.map((x, xi) =>
                      xi === i ? { ...x, metric_value: Number(e.target.value) || 0 } : x
                    ),
                  }))
                }
              />
              <Input
                className="col-span-3"
                placeholder="الوحدة (شهر/%..)"
                value={m.metric_unit}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    metrics: s.metrics.map((x, xi) => (xi === i ? { ...x, metric_unit: e.target.value } : x)),
                  }))
                }
              />
              <button
                type="button"
                onClick={() => setState((s) => ({ ...s, metrics: s.metrics.filter((_, xi) => xi !== i) }))}
                className="col-span-1 flex items-center justify-center rounded-xl2 border border-red-100 text-red-500 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-forest-500">توزيع الدعم (يجب أن يجمع 100%)</h3>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              setState((s) => ({
                ...s,
                distribution: [
                  ...s.distribution,
                  { category_key: "custom", category_label: "", percentage: 0, description: "", color_hex: "#4E7A64" },
                ],
              }))
            }
          >
            <Plus className="h-3.5 w-3.5" /> إضافة قسم
          </Button>
        </div>
        <div className="space-y-2">
          {state.distribution.map((d, i) => (
            <div key={i} className="grid grid-cols-12 gap-2">
              <Input
                className="col-span-3"
                placeholder="اسم القسم"
                value={d.category_label}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    distribution: s.distribution.map((x, xi) =>
                      xi === i ? { ...x, category_label: e.target.value } : x
                    ),
                  }))
                }
              />
              <Input
                className="col-span-2"
                type="number"
                placeholder="النسبة %"
                value={d.percentage}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    distribution: s.distribution.map((x, xi) =>
                      xi === i ? { ...x, percentage: Number(e.target.value) || 0 } : x
                    ),
                  }))
                }
              />
              <Input
                className="col-span-5"
                placeholder="شرح مختصر يظهر عند الضغط"
                value={d.description}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    distribution: s.distribution.map((x, xi) =>
                      xi === i ? { ...x, description: e.target.value } : x
                    ),
                  }))
                }
              />
              <input
                type="color"
                className="col-span-1 h-11 w-full cursor-pointer rounded-xl2 border border-forest-200"
                value={d.color_hex}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    distribution: s.distribution.map((x, xi) =>
                      xi === i ? { ...x, color_hex: e.target.value } : x
                    ),
                  }))
                }
              />
              <button
                type="button"
                onClick={() =>
                  setState((s) => ({ ...s, distribution: s.distribution.filter((_, xi) => xi !== i) }))
                }
                className="col-span-1 flex items-center justify-center rounded-xl2 border border-red-100 text-red-500 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-forest-400">
          المجموع الحالي: {state.distribution.reduce((sum, d) => sum + d.percentage, 0)}%
        </p>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-forest-500">أبرز الإنجازات</h3>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              setState((s) => ({
                ...s,
                achievements: [...s.achievements, { achievement_key: "stability", title: "", description: "" }],
              }))
            }
          >
            <Plus className="h-3.5 w-3.5" /> إضافة إنجاز
          </Button>
        </div>
        <div className="space-y-2">
          {state.achievements.map((a, i) => (
            <div key={i} className="grid grid-cols-12 gap-2">
              <Input
                className="col-span-4"
                placeholder="العنوان"
                value={a.title}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    achievements: s.achievements.map((x, xi) => (xi === i ? { ...x, title: e.target.value } : x)),
                  }))
                }
              />
              <Input
                className="col-span-7"
                placeholder="الوصف"
                value={a.description}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    achievements: s.achievements.map((x, xi) =>
                      xi === i ? { ...x, description: e.target.value } : x
                    ),
                  }))
                }
              />
              <button
                type="button"
                onClick={() =>
                  setState((s) => ({ ...s, achievements: s.achievements.filter((_, xi) => xi !== i) }))
                }
                className="col-span-1 flex items-center justify-center rounded-xl2 border border-red-100 text-red-500 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
