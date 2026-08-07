import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { isAIConfigured } from "@/lib/ai/client";

export type TaskSuggestionPayload = {
  taskTitle: string;
  description: string;
  durationDays: number;
  steps: string[];
  requiredEvidence: string;
  risks: string;
  expectedOutputs: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
};

const TOOL_NAME = "submit_task_suggestion";
const inputSchema = {
  type: "object" as const,
  properties: {
    taskTitle: { type: "string" },
    description: { type: "string" },
    durationDays: { type: "number" },
    steps: { type: "array", items: { type: "string" } },
    requiredEvidence: { type: "string" },
    risks: { type: "string" },
    expectedOutputs: { type: "string" },
    priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
  },
  required: ["taskTitle", "description", "durationDays", "steps", "requiredEvidence", "risks", "expectedOutputs", "priority"],
};

function fallbackSuggestion(indicatorName: string, gapDescription: string, currentLevel: string, targetLevel: string): TaskSuggestionPayload {
  return {
    taskTitle: `تطوير: ${indicatorName}`,
    description: `إغلاق الفجوة بين المستوى الحالي (${currentLevel}) والمستوى المستهدف (${targetLevel}) في مؤشر "${indicatorName}". ${gapDescription}`,
    durationDays: 21,
    steps: ["مراجعة الوضع الحالي وتحديد المتطلبات", "إعداد المخرج/الوثيقة المطلوبة", "اعتماد المخرج من الجهة المختصة داخل الجمعية", "رفع الشاهد النهائي على المنصة"],
    requiredEvidence: "وثيقة أو شاهد رسمي يثبت اكتمال المستوى المستهدف",
    risks: "قد يتأخر التنفيذ لعدم توفر الوقت الكافي لدى الفريق التنفيذي",
    expectedOutputs: `الوصول لمستوى "${targetLevel}" في هذا المؤشر`,
    priority: "MEDIUM",
  };
}

export async function generateTaskSuggestion(developmentGapId: string): Promise<TaskSuggestionPayload> {
  const gap = await prisma.developmentGap.findUniqueOrThrow({ where: { id: developmentGapId }, include: { indicator: true } });

  if (!isAIConfigured()) {
    return fallbackSuggestion(gap.indicator.name, gap.gapDescription, gap.currentLevel, gap.targetLevel);
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1500,
      tools: [{ name: TOOL_NAME, description: "اقتراح مهمة تطويرية", input_schema: inputSchema }],
      tool_choice: { type: "tool", name: TOOL_NAME },
      messages: [
        {
          role: "user",
          content: `أنت مساعد ذكاء اصطناعي يعاون مستشار تطوير مؤسسي في بناء خطة تطوير 100 يوم لجمعية أهلية.
المؤشر: ${gap.indicator.name}
المستوى الحالي المعتمد: ${gap.currentLevel} (الدرجة ${gap.approvedScore})
المستوى المستهدف: ${gap.targetLevel}
وصف الفجوة: ${gap.gapDescription}

اقترح مهمة تطويرية واحدة عملية وقابلة للتنفيذ خلال برنامج 100 يوم لإغلاق هذه الفجوة، بالعربية الفصحى. القرار النهائي بقبول أو تعديل أو تجاهل الاقتراح يعود للمستشار دائمًا.`,
        },
      ],
    });
    const toolUse = message.content.find((c) => c.type === "tool_use") as
      | Extract<(typeof message.content)[number], { type: "tool_use" }>
      | undefined;
    if (!toolUse) throw new Error("no structured output");
    return toolUse.input as TaskSuggestionPayload;
  } catch (err) {
    console.error("AI task suggestion failed, using fallback heuristic:", err);
    return fallbackSuggestion(gap.indicator.name, gap.gapDescription, gap.currentLevel, gap.targetLevel);
  }
}
