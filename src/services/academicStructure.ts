/**
 * Centralized Academic Curriculum Structure for "A is Impossible"
 *
 * The academic hierarchy is fixed and predefined:
 * Year → Module → Subject → Lecture Deck
 *
 * Users must select from predefined options.
 * Users CANNOT create, rename, delete, or modify years, modules, or subjects.
 * ONLY lecture names are user-defined.
 *
 * Future modules and years are easily extended simply by modifying
 * ACADEMIC_CURRICULUM_CONFIG below, without touching platform logic.
 */

export interface AcademicModuleConfig {
  id: string;
  name: string;
  subjects: string[];
}

export interface AcademicYearConfig {
  id: string;
  name: string;
  modules: AcademicModuleConfig[];
}

export interface AcademicCurriculumConfig {
  defaultYear: string;
  years: AcademicYearConfig[];
}

/**
 * STANDARD SUBJECTS AVAILABLE INSIDE EVERY MODULE
 * As required for Egyptian medical faculties:
 * - Anatomy
 * - Physiology
 * - Biochemistry
 * - Histology
 * - Pathology
 * - Pharmacology
 * - Microbiology
 * - Parasitology
 */
export const STANDARD_SUBJECTS: readonly string[] = [
  'Anatomy',
  'Physiology',
  'Biochemistry',
  'Histology',
  'Pathology',
  'Pharmacology',
  'Microbiology',
  'Parasitology',
] as const;

/**
 * CENTRALIZED ACADEMIC CONFIGURATION OBJECT
 *
 * Initial implementation includes:
 * YEAR 2
 * Modules:
 *   1. Blood
 *   2. CVS
 *   3. Respiratory
 *
 * Subjects inside every module:
 *   - Anatomy, Physiology, Biochemistry, Histology, Pathology, Pharmacology, Microbiology, Parasitology
 *
 * To add Year 1, Year 3, or other modules in the future, simply add them here.
 */
export const ACADEMIC_CURRICULUM_CONFIG: AcademicCurriculumConfig = {
  defaultYear: 'Year 2',
  years: [
    {
      id: 'Year 2',
      name: 'Year 2',
      modules: [
        {
          id: 'Blood',
          name: 'Blood',
          subjects: [...STANDARD_SUBJECTS],
        },
        {
          id: 'CVS',
          name: 'CVS',
          subjects: [...STANDARD_SUBJECTS],
        },
        {
          id: 'Respiratory',
          name: 'Respiratory',
          subjects: [...STANDARD_SUBJECTS],
        },
      ],
    },
  ],
};

/* ==========================================================================
   CENTRALIZED ACCESSORS & UTILITIES
   Avoid hardcoding anywhere across the codebase.
   ========================================================================== */

/**
 * Returns all configured academic years (e.g. ['Year 2'])
 */
export function getAcademicYears(): string[] {
  return ACADEMIC_CURRICULUM_CONFIG.years.map((y) => y.name);
}

/**
 * Returns default academic year ('Year 2')
 */
export function getDefaultYear(): string {
  return ACADEMIC_CURRICULUM_CONFIG.defaultYear || ACADEMIC_CURRICULUM_CONFIG.years[0]?.name || 'Year 2';
}

/**
 * Returns all predefined modules for a given year (e.g. ['Blood', 'CVS', 'Respiratory'])
 */
export function getModulesForYear(yearName?: string): string[] {
  const targetName = yearName || getDefaultYear();
  const yearConfig =
    ACADEMIC_CURRICULUM_CONFIG.years.find(
      (y) => y.name === targetName || y.id === targetName
    ) || ACADEMIC_CURRICULUM_CONFIG.years[0];

  return yearConfig ? yearConfig.modules.map((m) => m.name) : [];
}

/**
 * Returns the default module for a given year ('Blood' or 'CVS')
 */
export function getDefaultModule(yearName?: string): string {
  const modules = getModulesForYear(yearName);
  return modules[0] || 'Blood';
}

/**
 * Returns all predefined subjects for a given year & module
 * (Anatomy, Physiology, Biochemistry, Histology, Pathology, Pharmacology, Microbiology, Parasitology)
 */
export function getSubjectsForModule(yearName?: string, moduleName?: string): string[] {
  const targetYearName = yearName || getDefaultYear();
  const yearConfig =
    ACADEMIC_CURRICULUM_CONFIG.years.find(
      (y) => y.name === targetYearName || y.id === targetYearName
    ) || ACADEMIC_CURRICULUM_CONFIG.years[0];

  if (!yearConfig) return [...STANDARD_SUBJECTS];

  const targetModuleName = moduleName || yearConfig.modules[0]?.name;
  const modConfig = yearConfig.modules.find(
    (m) =>
      m.name === targetModuleName ||
      m.id === targetModuleName ||
      m.name.toLowerCase() === (targetModuleName || '').toLowerCase()
  );

  return modConfig ? [...modConfig.subjects] : [...STANDARD_SUBJECTS];
}

/**
 * Returns default subject for a given module ('Physiology' or 'Anatomy')
 */
export function getDefaultSubject(yearName?: string, moduleName?: string): string {
  const subjects = getSubjectsForModule(yearName, moduleName);
  return subjects[1] || subjects[0] || 'Physiology';
}

/**
 * Checks whether an academic path is valid according to the centralized curriculum
 */
export function isValidAcademicPath(year: string, module: string, subject: string): boolean {
  const years = getAcademicYears();
  if (!years.includes(year)) return false;
  const modules = getModulesForYear(year);
  if (!modules.includes(module)) return false;
  const subjects = getSubjectsForModule(year, module);
  return subjects.includes(subject);
}

/* ==========================================================================
   BACKWARD-COMPATIBILITY EXPORTS
   Mapped dynamically from ACADEMIC_CURRICULUM_CONFIG
   ========================================================================== */

export const PREDEFINED_YEARS: string[] = getAcademicYears();

export const PREDEFINED_MODULES: Record<string, string[]> = ACADEMIC_CURRICULUM_CONFIG.years.reduce(
  (acc, y) => {
    acc[y.name] = y.modules.map((m) => m.name);
    return acc;
  },
  {} as Record<string, string[]>
);

export const PREDEFINED_SUBJECTS: Record<string, string[]> = ACADEMIC_CURRICULUM_CONFIG.years.reduce(
  (acc, y) => {
    y.modules.forEach((m) => {
      acc[m.name] = m.subjects;
    });
    return acc;
  },
  {} as Record<string, string[]>
);

export const DEFAULT_SUBJECTS: string[] = [...STANDARD_SUBJECTS];
