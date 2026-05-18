import React from 'react';

/**
 * Format long text descriptions for better readability
 */
export function formatDescription(text: string): string {
  if (!text) return '';
  
  // Clean up the text and add proper paragraph breaks
  const formatted = text
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    .trim()
    // Add breaks after sentences that end with period + capital letter
    .replace(/\.\s*([A-Z])/g, '.\n\n$1')
    // Add breaks after common ending patterns
    .replace(/\.\s*(The|This|It|With|Genie|Users|Features)/g, '.\n\n$1')
    // Add breaks before common starting words
    .replace(/\s+(The tool|This tool|It also|With over|Users can|Features include)/g, '\n\n$1')
    // Add breaks around numbers and statistics
    .replace(/(\d+[,.]?\d*\s*(free|templates|features|users))/gi, '\n\n$1')
    // Ensure proper spacing around periods
    .replace(/\.([A-Z])/g, '. $1')
    // Clean up multiple line breaks
    .replace(/\n\n+/g, '\n\n')
    .trim();
  
  return formatted;
}

/**
 * Format text into paragraphs for rendering
 */
export function formatTextIntoParagraphs(text: string): string[] {
  if (!text) return [];
  
  const formattedText = formatDescription(text);
  let paragraphs = formattedText
    .split('\n\n')
    .filter(p => p.trim().length > 10) // Filter out very short paragraphs
    .map(p => p.trim());
  
  // If we have very short first paragraphs, try to merge them for better overview
  if (paragraphs.length > 2) {
    const firstParagraph = paragraphs[0];
    const secondParagraph = paragraphs[1];
    
    // If first paragraph is very short (less than 100 chars), merge with second
    if (firstParagraph.length < 100 && secondParagraph.length < 200) {
      paragraphs = [
        `${firstParagraph} ${secondParagraph}`,
        ...paragraphs.slice(2)
      ];
    }
  }
  
  return paragraphs;
}

/**
 * Smart text truncation with proper word boundaries
 */
export function truncateText(text: string, maxLength: number = 200): string {
  if (!text || text.length <= maxLength) return text;
  
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
} 