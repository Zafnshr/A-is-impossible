package com.aplus.impossible.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aplus.impossible.data.model.QuestionType
import com.aplus.impossible.ui.theme.*

@Composable
fun QuestionTypeBadge(
    type: QuestionType,
    modifier: Modifier = Modifier,
    short: Boolean = false
) {
    val (bgColor, textColor, borderColor) = when (type) {
        QuestionType.SINGLE_MCQ -> Triple(PrimaryCyan.copy(alpha = 0.15f), PrimaryCyan, PrimaryCyan.copy(alpha = 0.35f))
        QuestionType.MULTIPLE_MCQ -> Triple(IndigoAccent.copy(alpha = 0.15f), IndigoAccent, IndigoAccent.copy(alpha = 0.35f))
        QuestionType.TRUE_FALSE -> Triple(SuccessGreen.copy(alpha = 0.15f), SuccessGreen, SuccessGreen.copy(alpha = 0.35f))
        QuestionType.MATCHING -> Triple(PrimaryTeal.copy(alpha = 0.15f), PrimaryTeal, PrimaryTeal.copy(alpha = 0.35f))
        QuestionType.ORDERING -> Triple(WarningAmber.copy(alpha = 0.15f), WarningAmber, WarningAmber.copy(alpha = 0.35f))
        QuestionType.CASE_STUDY -> Triple(PurpleCase.copy(alpha = 0.15f), PurpleCase, PurpleCase.copy(alpha = 0.35f))
    }

    Text(
        text = if (short) type.shortLabel else type.displayName,
        color = textColor,
        fontSize = 11.sp,
        fontWeight = FontWeight.SemiBold,
        modifier = modifier
            .clip(RoundedCornerShape(6.dp))
            .background(bgColor)
            .border(1.dp, borderColor, RoundedCornerShape(6.dp))
            .padding(horizontal = 8.dp, vertical = 3.dp)
    )
}
