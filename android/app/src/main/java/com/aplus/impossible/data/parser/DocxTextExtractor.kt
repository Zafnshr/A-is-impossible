package com.aplus.impossible.data.parser

import java.io.InputStream
import java.util.zip.ZipInputStream

/**
 * 100% Offline, Zero-Dependency DOCX Text Extractor for Android
 *
 * Reads Word OpenXML zip archive, finds 'word/document.xml',
 * and extracts all text content preserving paragraph breaks and line formatting.
 */
object DocxTextExtractor {

    fun extractText(inputStream: InputStream): String {
        val zip = ZipInputStream(inputStream)
        var entry = zip.nextEntry
        val sb = StringBuilder()

        while (entry != null) {
            if (entry.name.equals("word/document.xml", ignoreCase = true)) {
                val xmlContent = zip.bufferedReader(Charsets.UTF_8).readText()
                val extracted = parseWordXml(xmlContent)
                sb.append(extracted)
                break
            }
            zip.closeEntry()
            entry = zip.nextEntry
        }
        zip.close()

        return sb.toString().trim()
    }

    private fun parseWordXml(xml: String): String {
        val result = StringBuilder()
        // Paragraph regex to split paragraphs
        val paragraphRegex = Regex("<w:p[ >](.*?)</w:p>", RegexOption.DOT_MATCHES_ALL)
        val textRegex = Regex("<w:t[^>]*>(.*?)</w:t>", RegexOption.DOT_MATCHES_ALL)

        val paragraphs = paragraphRegex.findAll(xml)
        for (p in paragraphs) {
            val pContent = p.groupValues[1]
            val lineSb = StringBuilder()
            val texts = textRegex.findAll(pContent)
            for (t in texts) {
                val rawText = t.groupValues[1]
                val unescaped = unescapeXml(rawText)
                lineSb.append(unescaped)
            }
            val line = lineSb.toString().trim()
            if (line.isNotEmpty()) {
                result.append(line).append("\n")
            }
        }

        return result.toString()
    }

    private fun unescapeXml(text: String): String {
        return text
            .replace("&amp;", "&")
            .replace("&lt;", "<")
            .replace("&gt;", ">")
            .replace("&quot;", "\"")
            .replace("&apos;", "'")
    }
}
