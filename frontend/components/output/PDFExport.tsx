'use client';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { GeneratedPaper } from '@/types/paper';
import { Download } from 'lucide-react';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: 'Helvetica', color: '#1a1a1a' },
  header: { textAlign: 'center', marginBottom: 16, borderBottom: '1pt solid #ccc', paddingBottom: 10 },
  schoolName: { fontSize: 14, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  subtitle: { fontSize: 10, marginBottom: 2, color: '#444' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, fontSize: 9, color: '#555' },
  studentInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, fontSize: 10 },
  fieldLine: { borderBottom: '0.5pt solid #999', width: 80, marginLeft: 4 },
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  sectionInstruction: { fontSize: 9, color: '#555', fontStyle: 'italic', marginBottom: 8 },
  question: { flexDirection: 'row', marginBottom: 8, gap: 6 },
  questionNumber: { width: 18, fontSize: 10 },
  questionText: { flex: 1, fontSize: 10, lineHeight: 1.5 },
  difficultyRow: { flexDirection: 'row', gap: 6, marginTop: 3 },
  badge: { fontSize: 8, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 },
  easyBadge: { backgroundColor: '#d1fae5', color: '#065f46' },
  mediumBadge: { backgroundColor: '#fef9c3', color: '#713f12' },
  hardBadge: { backgroundColor: '#fee2e2', color: '#991b1b' },
  marksText: { fontSize: 8, color: '#888' },
  footer: { textAlign: 'center', fontSize: 8, color: '#aaa', marginTop: 20, borderTop: '0.5pt solid #eee', paddingTop: 8 },
  section: { marginBottom: 18 },
});

function PaperDocument({ paper }: { paper: GeneratedPaper }) {
  let qIndex = 1;
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.schoolName}>{paper.schoolName}</Text>
          <Text style={styles.subtitle}>Subject: {paper.subject}</Text>
          <Text style={styles.subtitle}>Class: {paper.class}</Text>
          <View style={styles.metaRow}>
            <Text>Time Allowed: {paper.duration}</Text>
            <Text>Maximum Marks: {paper.totalMarks}</Text>
          </View>
        </View>

        <View style={styles.studentInfo}>
          <Text>Name: <Text style={styles.fieldLine}>{'                    '}</Text></Text>
          <Text>Roll Number: <Text style={styles.fieldLine}>{'               '}</Text></Text>
          <Text>Class: <Text style={styles.fieldLine}>{'               '}</Text></Text>
        </View>

        {paper.sections.map((section, si) => (
          <View key={si} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionInstruction}>{section.instruction}</Text>
            {section.questions.map((q, qi) => {
              const num = qIndex++;
              return (
                <View key={qi} style={styles.question}>
                  <Text style={styles.questionNumber}>{num}.</Text>
                  <View style={styles.questionText}>
                    <Text>{q.text}</Text>
                    <Text style={styles.marksText}>[{q.marks} mark{q.marks > 1 ? 's' : ''}]</Text>
                  </View>
                </View>
              );
            })}
          </View>
        ))}

        <Text style={styles.footer}>End of Question Paper</Text>
      </Page>
    </Document>
  );
}

export function PDFExport({ paper }: { paper: GeneratedPaper }) {
  const filename = `${paper.subject.replace(/\s+/g, '_')}_question_paper.pdf`;
  return (
    <PDFDownloadLink document={<PaperDocument paper={paper} />} fileName={filename}>
      {({ loading }) => (
        <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors">
          <Download size={16} />
          {loading ? 'Preparing...' : 'Download as PDF'}
        </button>
      )}
    </PDFDownloadLink>
  );
}
