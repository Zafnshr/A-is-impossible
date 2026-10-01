import { parseQuestionsText } from '../src/services/importer';

console.log('====================================================');
console.log('REPRODUCIBLE MIXED DECK PARSER TEST');
console.log('Q1: Single MCQ');
console.log('Q2: Multiple MCQ');
console.log('Q3: True / False');
console.log('Q4: Matching');
console.log('Q5: Ordering');
console.log('CASE 1: Case Study with Q6.1 and Q6.2');
console.log('====================================================');

const mixedInput = `
Q1. Which of the following is the primary pacemaker of the normal human heart?
A) AV node
B) SA node
C) Purkinje fibers
D) Bundle of His

Q2. Which of the following are branchial arch derivatives? (Select all that apply)
A) Mandible
B) Stapes
C) Femur
D) Hyoid bone

Q3. The pulmonary vein carries deoxygenated blood.
A) True
B) False

Q4. Match the microorganism with the associated disease.

A. Streptococcus pyogenes
B. Mycobacterium tuberculosis
C. Vibrio cholerae
D. Clostridium tetani

1. Cholera
2. Tetanus
3. Tuberculosis
4. Rheumatic fever

Q5. Arrange the cardiac conduction pathway in the correct order.

1. Purkinje fibers
2. SA node
3. Bundle of His
4. AV node
5. Bundle branches

CASE 1

A 58-year-old male presents with crushing substernal chest pain radiating to his left shoulder and jaw.

Q6.1 What is the most likely initial diagnosis?
A) Stable angina
B) Acute ST-elevation myocardial infarction
C) Acute pericarditis
D) Gastroesophageal reflux disease

Q6.2 Which serum cardiac biomarker is most specific for myocardial injury?
A) CK-MB
B) Aspartate aminotransferase (AST)
C) Cardiac Troponin I
D) Lactate dehydrogenase (LDH)

OFFICIAL ANSWER KEY

1. B
2. A, B, D
3. B
4. A-4,B-3,C-1,D-2
5. 2,4,3,5,1
6.1 B
6.2 C
`;

const result = parseQuestionsText(mixedInput, {
  year: 'Year 2',
  module: 'CVS',
  subject: 'Cardiology',
  lectureName: 'Mixed Comprehensive Exam',
});

console.log('Total Detected Questions:', result.detectedQuestionCount);
console.log('Expected: 6');
console.log('Type Breakdown:', result.typeBreakdown);
console.log('Answer Keys Mapped:', `${result.answerKeyCount} / ${result.detectedQuestionCount}`);
console.log('Issues:', result.issues);
console.log('Warnings:', result.warnings);

console.log('\n--- DOCUMENT BLOCKS SUMMARY ---');
result.documentBlocks?.forEach((b, idx) => {
  console.log(`Block ${idx + 1}: ID=${b.blockId}, Q=${b.questionNumber}, Type=${b.detectedType}, Lines=${b.startLine}-${b.endLine}, Parser=${b.parserUsed}, AnswerToken=${b.rawAnswerToken || 'N/A'}`);
});

console.log('\n--- QUESTIONS VERIFICATION ---');
result.questions.forEach((q, idx) => {
  console.log(`\nQuestion ${idx + 1}:`);
  console.log(`  Type: ${q.type}`);
  console.log(`  Title: ${q.question}`);
  if (q.type === 'matching') {
    console.log(`  Pairs count: ${q.matchingPairs?.length}`);
    q.matchingPairs?.forEach((p) => console.log(`    ${p.left} -> ${p.right}`));
  } else if (q.type === 'ordering') {
    console.log(`  Items:`, q.options);
    console.log(`  CorrectOrder:`, q.correctOrder);
  } else if (q.type === 'case_study') {
    console.log(`  Vignette: ${q.caseVignette}`);
    console.log(`  Sub-questions count: ${q.subQuestions?.length}`);
    q.subQuestions?.forEach((sq, sidx) => {
      console.log(`    SubQ ${sidx + 1}: ${sq.question}`);
      console.log(`      Options:`, sq.options);
      console.log(`      CorrectAnswer: [${sq.correctAnswer}] ${sq.options[sq.correctAnswer]}`);
    });
  } else {
    console.log(`  Options:`, q.options);
    console.log(`  CorrectAnswers:`, q.correctAnswers);
  }
});
