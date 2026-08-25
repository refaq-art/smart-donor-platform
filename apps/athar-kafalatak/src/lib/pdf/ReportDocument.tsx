import "server-only";
import path from "path";
import { Document, Page, Text, View, Font, StyleSheet } from "@react-pdf/renderer";
import type { FullReport } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

const FONTS_DIR = path.join(process.cwd(), "src/lib/pdf/fonts");

Font.register({
  family: "Tajawal",
  fonts: [
    { src: path.join(FONTS_DIR, "Tajawal-Regular.ttf"), fontWeight: "normal" },
    { src: path.join(FONTS_DIR, "Tajawal-Medium.ttf"), fontWeight: "medium" },
    { src: path.join(FONTS_DIR, "Tajawal-Bold.ttf"), fontWeight: "bold" },
  ],
});

const COLORS = {
  forest: "#1F4D3D",
  sage: "#4E7A64",
  gold: "#C8A24A",
  beige: "#F7F3EA",
  text: "#22322B",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Tajawal",
    direction: "rtl",
    fontSize: 11,
    color: COLORS.text,
    padding: 40,
    backgroundColor: "#FFFFFF",
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottom: `2 solid ${COLORS.gold}`,
  },
  brand: {
    fontSize: 10,
    color: COLORS.sage,
    marginBottom: 6,
    fontWeight: "bold",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.forest,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.sage,
    marginTop: 6,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.forest,
    marginTop: 20,
    marginBottom: 10,
    textAlign: "right",
  },
  metricsRow: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 8,
  },
  metricBox: {
    width: "31%",
    backgroundColor: COLORS.beige,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    alignItems: "center",
  },
  metricValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.forest,
  },
  metricLabel: {
    fontSize: 9,
    color: COLORS.sage,
    marginTop: 4,
    textAlign: "center",
  },
  distRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "0.5 solid #E5E0D3",
    paddingVertical: 6,
  },
  distLabel: { fontSize: 10.5, textAlign: "right" },
  distValue: { fontSize: 10.5, fontWeight: "bold", color: COLORS.forest },
  journeyItem: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: COLORS.beige,
    borderRadius: 8,
  },
  journeyTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: COLORS.forest,
    marginBottom: 3,
    textAlign: "right",
  },
  journeyDesc: { fontSize: 10, lineHeight: 1.5, textAlign: "right" },
  achRow: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 },
  achBox: {
    width: "48%",
    borderRadius: 8,
    border: "0.5 solid #E5E0D3",
    padding: 10,
    marginBottom: 8,
  },
  achTitle: { fontSize: 10.5, fontWeight: "bold", color: COLORS.forest, textAlign: "right" },
  achDesc: { fontSize: 9.5, marginTop: 3, textAlign: "right", lineHeight: 1.4 },
  thankBox: {
    marginTop: 20,
    backgroundColor: COLORS.forest,
    color: "#FFFFFF",
    borderRadius: 8,
    padding: 16,
  },
  thankText: { fontSize: 11, lineHeight: 1.7, textAlign: "right", color: "#FFFFFF" },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    fontSize: 8,
    color: COLORS.sage,
    textAlign: "center",
  },
});

export function ReportDocument({ data }: { data: FullReport }) {
  const { report, sponsor } = data;

  return (
    <Document title={report.title}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>أثر كفالتك</Text>
          <Text style={styles.title}>{report.title}</Text>
          <Text style={styles.subtitle}>
            {sponsor.honorific} {sponsor.full_name} · {formatDate(report.period_start)} إلى{" "}
            {formatDate(report.period_end)}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>أبرز الأرقام</Text>
        <View style={styles.metricsRow}>
          {data.metrics.map((m) => (
            <View key={m.id} style={styles.metricBox}>
              <Text style={styles.metricValue}>
                {new Intl.NumberFormat("ar-SA").format(m.metric_value)}
                {m.metric_unit ? ` ${m.metric_unit}` : ""}
              </Text>
              <Text style={styles.metricLabel}>{m.metric_label}</Text>
            </View>
          ))}
        </View>
        <Text style={{ fontSize: 10, textAlign: "right", marginTop: 4, color: COLORS.sage }}>
          إجمالي الدعم خلال الفترة: {formatCurrency(report.total_support)}
        </Text>

        <Text style={styles.sectionTitle}>توزيع الدعم</Text>
        {data.distribution.map((d) => (
          <View key={d.id} style={styles.distRow}>
            <Text style={styles.distValue}>{d.percentage}%</Text>
            <Text style={styles.distLabel}>{d.category_label}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>رحلتي مع كفالتك</Text>
        {data.journey.map((j) => (
          <View key={j.id} style={styles.journeyItem}>
            <Text style={styles.journeyTitle}>{j.title}</Text>
            <Text style={styles.journeyDesc}>{j.description}</Text>
          </View>
        ))}

        <Text style={styles.footer} fixed>
          تقرير صادر بتاريخ {formatDate(new Date().toISOString())} — هذه شخصية تمثيلية تعبر عن
          أثر الكفالة مع الحفاظ على خصوصية المستفيدين.
        </Text>
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>أبرز الإنجازات</Text>
        <View style={styles.achRow}>
          {data.achievements.map((a) => (
            <View key={a.id} style={styles.achBox}>
              <Text style={styles.achTitle}>{a.title}</Text>
              <Text style={styles.achDesc}>{a.description}</Text>
            </View>
          ))}
        </View>

        {data.stories[0] ? (
          <>
            <Text style={styles.sectionTitle}>لحظة صنعت فرقًا</Text>
            <View style={{ backgroundColor: COLORS.beige, borderRadius: 8, padding: 14 }}>
              <Text style={{ fontSize: 12, fontWeight: "bold", textAlign: "right", lineHeight: 1.6 }}>
                «{data.stories[0].quote_text}»
              </Text>
              <Text style={{ fontSize: 9, color: COLORS.sage, textAlign: "right", marginTop: 6 }}>
                {data.stories[0].context_note}
              </Text>
            </View>
          </>
        ) : null}

        {report.thank_you_message ? (
          <View style={styles.thankBox}>
            <Text style={{ fontSize: 12, fontWeight: "bold", color: "#FFFFFF", textAlign: "right", marginBottom: 6 }}>
              رسالة شكر
            </Text>
            <Text style={styles.thankText}>{report.thank_you_message}</Text>
          </View>
        ) : null}

        <Text style={styles.footer} fixed>
          أثر كفالتك — تقرير صادر بتاريخ {formatDate(new Date().toISOString())}
        </Text>
      </Page>
    </Document>
  );
}
