import { IAssignment } from '../models/Assignment.model';

export function buildGenerationPrompt(assignment: IAssignment, extractedText?: string): string {
  const questionBreakdown = assignment.questionTypes
    .map((qt) => `- ${qt.type}: ${qt.count} questions, ${qt.marks} mark(s) each`)
    .join('\n');

  return `You are an expert teacher. Generate a complete question paper as a JSON object.

Assignment details:
- Subject: ${assignment.subject}
- Total Questions: ${assignment.totalQuestions}
- Total Marks: ${assignment.totalMarks}
${assignment.additionalInfo ? `- Additional Instructions: ${assignment.additionalInfo}` : ''}
${extractedText ? `\nReference Material (use this content to generate relevant questions):\n${extractedText.slice(0, 4000)}` : ''}

Question breakdown (STRICTLY follow these counts and marks — do not add or remove questions):
${questionBreakdown}

Rules:
1. Create exactly one section per question type listed above.
2. Each section MUST contain EXACTLY the number of questions specified — no more, no less.
3. Every question in a section MUST carry EXACTLY the marks specified for that type.
4. Each section must have a title, an instruction line, and the list of questions.
5. Each question must have: text, answer (a concise model answer or correct option), difficulty (easy/medium/hard), marks (integer), type (same as section type).
6. Distribute difficulty: roughly 40% easy, 40% medium, 20% hard per section.
7. schoolName should be "Delhi Public School, Bokaro Steel City".
8. class should be "Grade 8".
9. duration should be calculated as "45 minutes" for up to 20 marks, "1 hour" for up to 40, "2 hours" for up to 80, "3 hours" otherwise.
10. Return ONLY valid JSON. No markdown, no explanation.

Required JSON structure:
{
  "schoolName": "string",
  "subject": "string",
  "class": "string",
  "duration": "string",
  "totalMarks": number,
  "sections": [
    {
      "title": "Section A",
      "instruction": "Attempt all questions. Each question carries N marks.",
      "questions": [
        { "text": "...", "answer": "...", "difficulty": "easy", "marks": 2, "type": "Multiple Choice Questions" }
      ]
    }
  ]
}`;
}
