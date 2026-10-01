import { parseQuestionsText } from '../src/services/importer';

console.log('====================================================');
console.log('TEST 1: MATCHING QUESTION');
console.log('====================================================');

const matchingInput = `
Q1. Match the microorganism with the associated disease.

A. Streptococcus pyogenes
B. Mycobacterium tuberculosis
C. Vibrio cholerae
D. Clostridium tetani

1. Cholera
2. Tetanus
3. Tuberculosis
4. Rheumatic fever

OFFICIAL ANSWER KEY

1. A-4,B-3,C-1,D-2
`;

const res1 = parseQuestionsText(matchingInput, {
  year: 'Year 2',
  module: 'Microbiology',
  subject: 'Pathology',
  lectureName: 'Matching Test',
});

console.log('Detected questions:', res1.detectedQuestionCount);
console.log('Type breakdown:', res1.typeBreakdown);
console.log('Issues:', res1.issues);
if (res1.questions[0]) {
  console.log('Question 1 type:', res1.questions[0].type);
  console.log('Question 1 matchingPairs:', JSON.stringify(res1.questions[0].matchingPairs, null, 2));
}

console.log('\n====================================================');
console.log('TEST 2: ORDERING QUESTION');
console.log('====================================================');

const orderingInput = `
Q1. Arrange the cardiac conduction pathway in the correct order.

1. Purkinje fibers
2. SA node
3. Bundle of His
4. AV node
5. Bundle branches

OFFICIAL ANSWER KEY

1. 2,4,3,5,1
`;

const res2 = parseQuestionsText(orderingInput, {
  year: 'Year 2',
  module: 'CVS',
  subject: 'Physiology',
  lectureName: 'Ordering Test',
});

console.log('Detected questions:', res2.detectedQuestionCount);
console.log('Type breakdown:', res2.typeBreakdown);
console.log('Issues:', res2.issues);
if (res2.questions[0]) {
  console.log('Question 1 type:', res2.questions[0].type);
  console.log('Question 1 options (items):', res2.questions[0].options);
  console.log('Question 1 correctOrder:', res2.questions[0].correctOrder);
}

console.log('\n====================================================');
console.log('TEST 3: CASE-BASED QUESTIONS');
console.log('====================================================');

const caseInput = `
CASE 1

A patient presents with chest pain radiating to the left arm.

Q1.1 What is the most likely diagnosis?

A) Stable angina
B) Myocardial infarction
C) Pulmonary embolism
D) Pericarditis

Q1.2 Which biomarker is most specific?

A) CK-MB
B) AST
C) Troponin I
D) LDH

CASE 2

A patient presents with polyuria and hyperglycemia.

Q2.1 What is the most likely diagnosis?

A) Diabetes Mellitus
B) Hyperthyroidism
C) Cushing Syndrome
D) SIADH

Q2.2 Which hormone is primarily deficient?

A) Cortisol
B) Growth Hormone
C) Insulin
D) ADH

OFFICIAL ANSWER KEY

1.1 B
1.2 C
2.1 A
2.2 C
`;

const res3 = parseQuestionsText(caseInput, {
  year: 'Year 2',
  module: 'Endocrine',
  subject: 'Internal Medicine',
  lectureName: 'Case Test',
});

console.log('Detected questions:', res3.detectedQuestionCount);
console.log('Type breakdown:', res3.typeBreakdown);
console.log('Issues:', res3.issues);
res3.questions.forEach((q, idx) => {
  console.log(`\nCase Question ${idx + 1}:`);
  console.log('Type:', q.type);
  console.log('Title:', q.question);
  console.log('Vignette:', q.caseVignette);
  console.log('Sub-questions count:', q.subQuestions?.length);
});

console.log('TEST 4: STANDARD SINGLE MCQ');
console.log('====================================================');

const singleInput = `
Q1. Which of the following is the pacemaker of the normal human heart?
A) AV node
B) SA node
C) Purkinje fibers
D) Bundle of His

OFFICIAL ANSWER KEY
1. B
`;

const res4 = parseQuestionsText(singleInput, {
  year: 'Year 2',
  module: 'CVS',
  subject: 'Physiology',
  lectureName: 'Single MCQ Test',
});

console.log('Detected questions:', res4.detectedQuestionCount);
console.log('Type breakdown:', res4.typeBreakdown);
console.log('Issues:', res4.issues);
console.log('Options:', res4.questions[0]?.options);
console.log('Correct answers:', res4.questions[0]?.correctAnswers);

console.log('\n====================================================');
console.log('TEST 5: MULTI-ANSWER MCQ');
console.log('====================================================');

const multiInput = `
Q1. Which of the following are branchial arch derivatives? (Select all that apply)
A) Mandible
B) Stapes
C) Femur
D) Hyoid bone

OFFICIAL ANSWER KEY
1. A, B, D
`;

const res5 = parseQuestionsText(multiInput, {
  year: 'Year 1',
  module: 'Head & Neck',
  subject: 'Anatomy',
  lectureName: 'Multi MCQ Test',
});

console.log('Detected questions:', res5.detectedQuestionCount);
console.log('Type breakdown:', res5.typeBreakdown);
console.log('Issues:', res5.issues);
console.log('Options:', res5.questions[0]?.options);
console.log('Correct answers:', res5.questions[0]?.correctAnswers);

console.log('\n====================================================');
console.log('TEST 6: TRUE / FALSE');
console.log('====================================================');

const tfInput = `
Q1. The pulmonary vein carries deoxygenated blood.
A) True
B) False

OFFICIAL ANSWER KEY
1. B
`;

const res6 = parseQuestionsText(tfInput, {
  year: 'Year 2',
  module: 'CVS',
  subject: 'Physiology',
  lectureName: 'TF Test',
});

console.log('Detected questions:', res6.detectedQuestionCount);
console.log('Type breakdown:', res6.typeBreakdown);
console.log('Issues:', res6.issues);
console.log('Options:', res6.questions[0]?.options);
console.log('Correct answers:', res6.questions[0]?.correctAnswers);

