package com.aplus.impossible.data.model

/**
 * Centralized Academic Curriculum Structure for "A+ is Impossible" (Android)
 *
 * The academic hierarchy is fixed and predefined:
 * Year → Module → Subject → Lecture Deck
 *
 * Standard Predefined Subjects for Egyptian Medical Faculties:
 * - Anatomy, Physiology, Biochemistry, Histology, Pathology,
 *   Pharmacology, Microbiology, Parasitology
 */

data class AcademicModule(
    val id: String,
    val name: String,
    val subjects: List<String>
)

data class AcademicYear(
    val id: String,
    val name: String,
    val modules: List<AcademicModule>
)

object AcademicCurriculum {
    val STANDARD_SUBJECTS: List<String> = listOf(
        "Anatomy",
        "Physiology",
        "Biochemistry",
        "Histology",
        "Pathology",
        "Pharmacology",
        "Microbiology",
        "Parasitology"
    )

    val CURRICULUM: List<AcademicYear> = listOf(
        AcademicYear(
            id = "Year 2",
            name = "Year 2",
            modules = listOf(
                AcademicModule(id = "Blood", name = "Blood", subjects = STANDARD_SUBJECTS),
                AcademicModule(id = "CVS", name = "CVS", subjects = STANDARD_SUBJECTS),
                AcademicModule(id = "Respiratory", name = "Respiratory", subjects = STANDARD_SUBJECTS)
            )
        )
    )

    const val DEFAULT_YEAR = "Year 2"

    fun getAcademicYears(): List<String> = CURRICULUM.map { it.name }

    fun getModulesForYear(year: String = DEFAULT_YEAR): List<String> {
        val y = CURRICULUM.find { it.name == year || it.id == year } ?: CURRICULUM.firstOrNull()
        return y?.modules?.map { it.name } ?: listOf("Blood", "CVS", "Respiratory")
    }

    fun getDefaultModule(year: String = DEFAULT_YEAR): String {
        return getModulesForYear(year).firstOrNull() ?: "Blood"
    }

    fun getSubjectsForModule(year: String = DEFAULT_YEAR, module: String = "Blood"): List<String> {
        val y = CURRICULUM.find { it.name == year || it.id == year } ?: CURRICULUM.firstOrNull()
        val m = y?.modules?.find { it.name.equals(module, ignoreCase = true) || it.id.equals(module, ignoreCase = true) }
        return m?.subjects ?: STANDARD_SUBJECTS
    }

    fun getDefaultSubject(year: String = DEFAULT_YEAR, module: String = "Blood"): String {
        val subjects = getSubjectsForModule(year, module)
        return if (subjects.size > 1) subjects[1] else (subjects.firstOrNull() ?: "Physiology")
    }
}
