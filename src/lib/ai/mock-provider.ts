import type { AIProvider, AIRequest, AIResult } from "./types";

function ctx(context: Record<string, string | undefined>, key: string) {
  const v = context[key]?.trim();
  return v && v.length > 0 ? v : null;
}

function missingNote(fields: string[]) {
  if (fields.length === 0) return "";
  return `\n\n⚠️ ملاحظة: لم تتوفر معلومات كافية عن: ${fields.join("، ")}. الرجاء إدخال هذه البيانات لتحسين الدقة.`;
}

export const mockProvider: AIProvider = {
  name: "mock",
  async run({ action, context }: AIRequest): Promise<AIResult> {
    const warning =
      "تعمل حاليًا في الوضع التجريبي (Mock Mode) بدون مفتاح ذكاء اصطناعي حقيقي. النتائج توضيحية مبنية على المدخلات فقط. لتفعيل نتائج أدق اضبط AI_PROVIDER في ملف البيئة.";

    let text = "";

    switch (action) {
      case "draft_executive_summary": {
        const title = ctx(context, "title");
        const problem = ctx(context, "problemStatement");
        const objective = ctx(context, "generalObjective");
        const beneficiaries = ctx(context, "beneficiaries");
        const missing = [];
        if (!problem) missing.push("وصف المشكلة");
        if (!objective) missing.push("الهدف العام");
        if (!beneficiaries) missing.push("الفئة المستفيدة");
        text = `يسعى مشروع "${title || "[أدخل اسم المشروع]"}" إلى ${objective || "[أدخل الهدف العام للمشروع]"}، وذلك استجابةً لـ${problem ? ` "${problem}"` : " [أدخل وصف المشكلة]"}. يستهدف المشروع ${beneficiaries || "[أدخل الفئة المستفيدة]"}، ويسعى فريق العمل إلى تنفيذه وفق خطة عمل واضحة ومؤشرات أداء قابلة للقياس، بما يحقق أثرًا مستدامًا للمستفيدين ويعزز الشراكة مع الجهات الداعمة.${missingNote(missing)}`;
        break;
      }
      case "improve_problem_statement": {
        const problem = ctx(context, "text");
        if (!problem) {
          text = "لم يتم تزويدي بنص وصف المشكلة الحالي. الرجاء كتابة وصف أولي للمشكلة ثم إعادة المحاولة.";
        } else {
          text = `الصياغة المقترحة:\n"${problem}" — وهو ما يترتب عليه أثر سلبي مباشر على الفئة المستهدفة، وتشير المعطيات المتاحة إلى الحاجة الملحّة لتدخل نوعي يعالج جذور المشكلة لا أعراضها فقط. (يُنصح بإضافة رقم أو نسبة موثقة إن توفرت لدى الجمعية لتعزيز الإقناع، دون افتراض رقم غير موثّق).`;
        }
        break;
      }
      case "suggest_objectives": {
        const problem = ctx(context, "problemStatement");
        const objective = ctx(context, "generalObjective");
        if (!problem && !objective) {
          text = "لا يمكن اقتراح أهداف دقيقة دون معرفة المشكلة أو الهدف العام للمشروع. الرجاء تعبئة هذه الحقول أولًا.";
        } else {
          text = [
            `رفع مستوى الاستفادة من الخدمة المستهدفة لدى الفئة المعنية خلال مدة تنفيذ المشروع.`,
            `تحسين [أدخل المؤشر المحدد] بنسبة [أدخل النسبة المستهدفة] بحلول نهاية المشروع.`,
            `بناء قدرات [الفئة المستفيدة أو الكادر] عبر أنشطة تدريبية وتأهيلية محددة.`,
            `ضمان استدامة الأثر من خلال آلية متابعة دورية بعد انتهاء التنفيذ.`,
          ].join("\n");
          text = `بناءً على: "${problem || objective}"، هذه أهداف تفصيلية مقترحة (راجعها وحدّد الأرقام المستهدفة الفعلية):\n\n${text}`;
        }
        break;
      }
      case "suggest_activities": {
        const objectives = ctx(context, "objectives");
        if (!objectives) {
          text = "الرجاء تزويدي بأهداف المشروع أولًا لأتمكن من اقتراح أنشطة متسقة معها.";
        } else {
          text = `أنشطة مقترحة بناءً على الأهداف المذكورة:\n- تحديد الفئة المستفيدة النهائية وآلية الترشيح والقبول.\n- تنفيذ [النشاط الرئيسي] وفق جدول زمني محدد.\n- تدريب الكادر أو المتطوعين القائمين على التنفيذ.\n- إعداد نظام متابعة وتوثيق دوري لمؤشرات الأداء.\n- تنظيم لقاء ختامي وتقييم الأثر مع المستفيدين.\n\nيرجى تخصيص الأنشطة أعلاه بما يتناسب مع طبيعة مشروعكم الفعلية.`;
        }
        break;
      }
      case "suggest_outputs_outcomes": {
        const activities = ctx(context, "activities");
        if (!activities) {
          text = "أحتاج إلى قائمة الأنشطة أولًا لاقتراح مخرجات ونتائج متسقة معها.";
        } else {
          text = `مخرجات مقترحة (مباشرة وقابلة للعدّ):\n- عدد [المستفيدين/الوحدات] التي تم تنفيذ النشاط لأجلها.\n- عدد الفعاليات أو الجلسات المنفذة.\n\nنتائج متوقعة (على مستوى الأثر):\n- تحسّن ملموس في [المؤشر المستهدف] لدى الفئة المستفيدة.\n- زيادة الوعي أو القدرة لدى المستفيدين في المجال المستهدف.\n\nيُرجى تحديد الأرقام الفعلية المستهدفة بدلًا من العبارات العامة أعلاه.`;
        }
        break;
      }
      case "suggest_kpis": {
        const outcomes = ctx(context, "outcomes") || ctx(context, "activities");
        if (!outcomes) {
          text = "الرجاء تزويدي بالأنشطة أو النتائج المتوقعة أولًا لاقتراح مؤشرات أداء مناسبة.";
        } else {
          text = `مؤشرات أداء مقترحة (SMART):\n- عدد المستفيدين الفعليين مقارنة بالمستهدف [أدخل الرقم].\n- نسبة إنجاز الأنشطة ضمن الجدول الزمني المحدد.\n- نسبة رضا المستفيدين (تُقاس عبر استبيان بعد التنفيذ).\n- نسبة تحقق النتائج المتوقعة خلال فترة المتابعة.\n\nحدد الأرقام والنسب المستهدفة الفعلية بناءً على إمكانيات مشروعكم.`;
        }
        break;
      }
      case "check_consistency": {
        const problem = ctx(context, "problemStatement");
        const objectives = ctx(context, "objectives");
        const activities = ctx(context, "activities");
        const outcomes = ctx(context, "outcomes");
        const missing = [];
        if (!problem) missing.push("وصف المشكلة");
        if (!objectives) missing.push("الأهداف");
        if (!activities) missing.push("الأنشطة");
        if (!outcomes) missing.push("النتائج المتوقعة");
        const notes: string[] = [];
        if (problem && objectives && !objectives.includes(problem.slice(0, 8))) {
          notes.push("تأكد أن الأهداف تعالج فعليًا جذور المشكلة الموصوفة وليس أعراضها فقط.");
        }
        if (activities && !outcomes) {
          notes.push("الأنشطة موجودة لكن لا توجد نتائج متوقعة مرتبطة بها — أضف نتائج قابلة للقياس.");
        }
        if (objectives && activities) {
          notes.push("راجع أن كل هدف له نشاط واحد على الأقل يحققه، وأن كل نشاط يخدم هدفًا محددًا.");
        }
        text = `${notes.length ? notes.map((n) => `• ${n}`).join("\n") : "لا توجد ملاحظات ترابط ظاهرة في الحقول المتوفرة."}${missingNote(missing)}`;
        break;
      }
      case "rewrite_formal": {
        const raw = ctx(context, "text");
        text = raw
          ? `الصياغة الرسمية المقترحة:\n"${raw}" — تجدر الإشارة إلى أهمية هذا الجانب ضمن رؤية الجمعية وخططها التنفيذية، وذلك بما يتسق مع أفضل الممارسات المؤسسية في التعامل مع الجهات المانحة.`
          : "الرجاء إدخال النص المطلوب إعادة صياغته.";
        break;
      }
      case "simplify_text": {
        const raw = ctx(context, "text");
        text = raw
          ? `نسخة مبسّطة:\n${raw.split(/(?<=[.؟!])\s+/).slice(0, 3).join(" ")}`
          : "الرجاء إدخال النص المطلوب تبسيطه.";
        break;
      }
      case "summarize_opportunity": {
        const req = ctx(context, "requirements");
        const field = ctx(context, "field");
        const amount = ctx(context, "expectedAmount");
        const deadline = ctx(context, "deadline");
        if (!req && !field) {
          text = "لا تتوفر شروط أو تفاصيل كافية عن الفرصة لتلخيصها. الرجاء تعبئة حقل الشروط والمتطلبات.";
        } else {
          text = `ملخص فرصة التمويل:\n- المجال: ${field || "غير محدد"}\n- القيمة المتوقعة: ${amount || "غير محددة"}\n- الموعد النهائي: ${deadline || "غير محدد"}\n- أبرز الشروط: ${req || "لم تُذكر شروط تفصيلية"}`;
        }
        break;
      }
      case "compare_project_opportunity": {
        const projField = ctx(context, "projectCategory");
        const oppField = ctx(context, "opportunityField");
        const req = ctx(context, "requirements");
        if (!projField || !oppField) {
          text = "أحتاج إلى فئة المشروع ومجال فرصة التمويل لإجراء المقارنة.";
        } else {
          const match = projField.trim() === oppField.trim();
          text = `نتيجة المقارنة:\n- مجال المشروع: ${projField}\n- مجال الفرصة: ${oppField}\n- ${match ? "✅ يوجد توافق مبدئي بين مجال المشروع ومجال الفرصة." : "⚠️ قد لا يوجد توافق مباشر بين مجال المشروع ومجال الفرصة — راجع الشروط بدقة."}\n${req ? `- شروط إضافية يجب التأكد من استيفائها: ${req}` : "- لا توجد شروط تفصيلية مسجلة للفرصة بعد."}`;
        }
        break;
      }
      case "missing_data_checklist": {
        const missing = context.missingSections?.split("|").filter(Boolean) || [];
        text =
          missing.length > 0
            ? `الحقول التالية غير مكتملة في طلب المنحة:\n${missing.map((m) => `- ${m}`).join("\n")}`
            : "جميع الحقول الأساسية مكتملة ظاهريًا. راجع الدقة والمحتوى قبل الإرسال.";
        break;
      }
      case "readiness_assessment": {
        const percent = Number(context.completionPercent || 0);
        const missing = context.missingSections?.split("|").filter(Boolean) || [];
        let verdict = "غير جاهز للإرسال بعد";
        if (percent >= 90) verdict = "جاهز للإرسال تقريبًا";
        else if (percent >= 60) verdict = "بحاجة لاستكمال بعض العناصر قبل الإرسال";
        text = `نسبة اكتمال الطلب الحالية: ${percent}%\nالتقييم: ${verdict}\n${
          missing.length ? `العناصر الناقصة:\n${missing.map((m) => `- ${m}`).join("\n")}` : "لا توجد عناصر ناقصة ظاهرة."
        }`;
        break;
      }
      case "clarifying_questions": {
        const missing = context.missingSections?.split("|").filter(Boolean) || [];
        text =
          missing.length > 0
            ? `أسئلة توضيحية مقترحة:\n${missing.map((m) => `- ما هو/هي "${m}" بالتحديد لهذا المشروع؟`).join("\n")}`
            : "لا توجد نقاط ناقصة واضحة تستدعي أسئلة توضيحية حاليًا.";
        break;
      }
      case "extract_donor_lead": {
        const title = ctx(context, "title");
        // الوضع التجريبي لا يستخلص بيانات حقيقية من الويب — يعيد نتيجة توضيحية واضحة المصدر
        // حتى يعمل مسار الاختبار كاملًا محليًا دون مفتاح ذكاء اصطناعي حقيقي.
        text = JSON.stringify({
          isDonorRelevant: Boolean(title),
          donorName: title ? `جهة تجريبية (Mock): ${title.slice(0, 40)}` : null,
          about: title ? "بيانات توضيحية مبنية على عنوان نتيجة البحث فقط — راجع المصدر قبل الاعتماد عليها." : null,
          sector: null,
          city: null,
          matchProjectId: null,
          matchReason: null,
          trendNote: "الوضع التجريبي لا يحلل توجهات حقيقية.",
        });
        break;
      }
      case "explain_eligibility": {
        const verdict = ctx(context, "verdict");
        const summary = ctx(context, "summary");
        const mandatoryIssues = context.mandatoryIssues?.split("\n").filter(Boolean) || [];
        const otherIssues = context.otherIssues?.split("\n").filter(Boolean) || [];

        if (!verdict || !summary) {
          text = "لا تتوفر نتيجة فحص أهلية بعد لأشرحها. الرجاء إضافة شروط الأهلية وتشغيل الفحص أولًا.";
        } else if (mandatoryIssues.length === 0 && otherIssues.length === 0) {
          text = `الحكم الحالي: ${verdict}.\n${summary}\n\nلا توجد نقاط تحتاج معالجة حاليًا — جميع الشروط المسجّلة مستوفاة.`;
        } else {
          const steps: string[] = [];
          mandatoryIssues.forEach((line, i) => steps.push(`${i + 1}. (إلزامي — الأهم) ${line}`));
          otherIssues.forEach((line, i) => steps.push(`${mandatoryIssues.length + i + 1}. (غير إلزامي) ${line}`));
          text = `الحكم الحالي: ${verdict}.\n${summary}\n\nخطة عملية مرتّبة بالأولوية للوصول إلى الأهلية الكاملة:\n${steps.join("\n")}\n\nابدأ بالبنود الإلزامية أولًا — فهي وحدها ما يحدد الأهلية النهائية؛ البنود غير الإلزامية تحسّن الفرصة لكنها لا تمنع التقديم.`;
        }
        break;
      }
      default: {
        text = "لم أتمكن من تحديد نوع المساعدة المطلوبة.";
      }
    }

    return { text, provider: "mock", warning };
  },
};
