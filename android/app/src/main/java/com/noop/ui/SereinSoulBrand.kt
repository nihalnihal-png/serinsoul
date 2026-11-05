package com.noop.ui

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

object SereinBrand {
    val blue = Color(0xFF2563EB)
    val ink = Color(0xFF1F2A44)
}

@Composable
fun SeriMascot(size: Dp, modifier: Modifier = Modifier) {
    Image(
        painter = painterResource(com.noop.R.drawable.seri_mascot),
        contentDescription = "Seri, the SereinSoul mascot",
        modifier = modifier.size(size),
    )
}

/** Sunrise greeting card with Seri, like the website hero. */
@Composable
fun SeriGreetingBanner(greeting: String, modifier: Modifier = Modifier) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(24.dp))
            .background(
                Brush.linearGradient(
                    listOf(Color(0xFFFFF1D0), Color(0xFFF6C26B), Color(0xFFA9C4EA)),
                ),
            )
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        SeriMascot(72.dp)
        Spacer(Modifier.width(12.dp))
        Column {
            Text(greeting, style = NoopType.title2, color = SereinBrand.ink)
            Text("Take a moment to breathe.", style = NoopType.subhead, color = Color(0xFF3B4558))
        }
    }
}

/** Floating "Hi, I’m Seri" bubble and mascot. */
@Composable
fun SeriChatButton(onClick: () -> Unit, modifier: Modifier = Modifier) {
    Row(
        modifier = modifier.clickable(onClick = onClick),
        verticalAlignment = Alignment.Bottom,
    ) {
        Box(
            Modifier
                .padding(bottom = 24.dp)
                .shadow(4.dp, RoundedCornerShape(18.dp))
                .background(Color.White, RoundedCornerShape(18.dp))
                .border(1.5.dp, SereinBrand.blue, RoundedCornerShape(18.dp))
                .padding(horizontal = 12.dp, vertical = 8.dp),
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    "Hi, I’m Seri.",
                    style = NoopType.caption.copy(fontWeight = FontWeight.Bold),
                    color = SereinBrand.ink,
                )
                Text(
                    "Tap to chat!",
                    style = NoopType.footnote.copy(fontWeight = FontWeight.Bold),
                    color = SereinBrand.ink,
                )
            }
        }
        SeriMascot(64.dp)
    }
}
