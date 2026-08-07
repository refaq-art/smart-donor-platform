import Anthropic from "@anthropic-ai/sdk";

export type AIIndicatorInput = {
  indicatorCode: string;
  domainName: string;
  criterionName: string;
  indicatorName: string;
  indicatorType: "MATURITY_LEVEL" | "COMPLETION_STAGE";
  levelDescriptions: { label: string; description: string }[];
  requiredEvidenceHint: string | null;
  answerText: string;
  evidenceNames: string[];
};

export type AIIndicatorOutput = {
  indicatorCode: string;
  insufficientInfo: boolean;
  proposedScore: number | null;
  rationale: string;
  evidenceUsed: string[];
  missingEvidence: string[];
  strengths: string;
  weaknesses: string;
  gap: string;
  suggestedNeed: string;
  aiSelfConfidence: number;
};

const TOOL_NAME = "submit_indicator_assessments";

function buildPrompt(orgName: string, phase: string, indicators: AIIndicatorInput[]) {
  return `أنت محرك تقييم مؤسسي ضمن منصة "مُطوّر" لتطوير الجمعيات الأهلية. مهمتك تحليل إجابات وشواهد جمعية "${orgName}" لمرحلة التقييم (${phase === "PRE" ? "القبلي" : "البعدي"}) لكل مؤشر على حدة، وإخراج تقييم مقترح.

قواعد صارمة يجب الالتزام بها دون استثناء:
1. ممنوع اختلاق أو افتراض وجود أي معلومة أو شاهد لم يُذكر صراحة في المدخلات.
2. إذا كانت الإجابة النصية والشواهد غير كافية للحكم، اجعل insufficientInfo=true واكتب في rationale عبارة "لا توجد أدلة كافية للحكم" ولا تمنح درجة (proposedScore=null).
3. لا تمنح المستوى الأعلى لمجرد أن الوصف النصي جيد الصياغة؛ استند فقط لما هو مذكور من شواهد فعلية مرفوعة.
4. اذكر بالتحديد أي شواهد استخدمتها من القائمة المرفقة، وأي شواهد مطلوبة غير متوفرة.
5. قيّم بصدق: strengths (نقاط قوة)، weaknesses (نقاط ضعف)، gap (الفجوة التطويرية عن المستوى المستهدف)، suggestedNeed (اقتراح احتياج تطويري مختصر).
6. aiSelfConfidence رقم بين 0 و1 يعكس ثقتك الذاتية في التقييم بناءً على وضوح واكتمال المدخلات فقط.
7. اكتب كل الحقول النصية بالعربية الفصحى الواضحة والمختصرة.

المؤشرات المطلوب تقييمها:
${JSON.stringify(indicators, null, 2)}

استخدم الأداة المتاحة لإرجاع مصفوفة تقييمات بنفس عدد المؤشرات المُدخلة، بنفس ترتيب indicatorCode.`;
}

const inputSchema = {
  type: "object" as const,
  properties: {
    assessments: {
      type: "array",
      items: {
        type: "object",
        properties: {
          indicatorCode: { type: "string" },
          insufficientInfo: { type: "boolean" },
          proposedScore: { type: ["number", "null"] },
          rationale: { type: "string" },
          evidenceUsed: { type: "array", items: { type: "string" } },
          missingEvidence: { type: "array", items: { type: "string" } },
          strengths: { type: "string" },
          weaknesses: { type: "string" },
          gap: { type: "string" },
          suggestedNeed: { type: "string" },
          aiSelfConfidence: { type: "number" },
        },
        required: [
          "indicatorCode",
          "insufficientInfo",
          "proposedScore",
          "rationale",
          "evidenceUsed",
          "missingEvidence",
          "strengths",
          "weaknesses",
          "gap",
          "suggestedNeed",
          "aiSelfConfidence",
        ],
      },
    },
  },
  required: ["assessments"],
};

export function isAIConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export async function runAIAssessmentBatch(
  orgName: string,
  phase: "PRE" | "POST",
  indicators: AIIndicatorInput[]
): Promise<AIIndicatorOutput[]> {
  if (!isAIConfigured()) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 8000,
    tools: [{ name: TOOL_NAME, description: "إرجاع تقييمات المؤشرات", input_schema: inputSchema }],
    tool_choice: { type: "tool", name: TOOL_NAME },
    messages: [{ role: "user", content: buildPrompt(orgName, phase, indicators) }],
  });

  const toolUse = message.content.find((c) => c.type === "tool_use") as
    | Extract<(typeof message.content)[number], { type: "tool_use" }>
    | undefined;
  if (!toolUse) throw new Error("AI did not return structured output");

  const parsed = toolUse.input as { assessments: AIIndicatorOutput[] };
  return parsed.assessments;
}
