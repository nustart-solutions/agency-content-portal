import { marked } from 'marked'

/**
 * Converts standard Markdown into native WordPress Gutenberg blocks.
 * Currently handles basic paragraphs, headings, and lists by wrapping the HTML.
 */
export function convertMarkdownToGutenberg(markdown: string): string {
  if (!markdown) return ''

  // Configure marked for synchronous lexing
  const tokens = marked.lexer(markdown)
  
  let blocks = ''

  for (const token of tokens) {
    if (token.type === 'paragraph') {
      const inlineHtml = marked.parseInline(token.text) as string
      blocks += `<!-- wp:paragraph -->\n<p>${inlineHtml}</p>\n<!-- /wp:paragraph -->\n\n`
    } else if (token.type === 'heading') {
      const inlineHtml = marked.parseInline(token.text) as string
      blocks += `<!-- wp:heading {"level":${token.depth}} -->\n<h${token.depth}>${inlineHtml}</h${token.depth}>\n<!-- /wp:heading -->\n\n`
    } else if (token.type === 'list') {
      const listTag = token.ordered ? 'ol' : 'ul'
      const items = token.items.map((item: any) => {
         const itemHtml = marked.parseInline(item.text) as string
         return `<li>${itemHtml}</li>`
      }).join('')
      blocks += `<!-- wp:list {"ordered":${token.ordered}} -->\n<${listTag}>${items}</${listTag}>\n<!-- /wp:list -->\n\n`
    } else if (token.type === 'space') {
      // ignore
    } else if (token.type === 'image') {
       blocks += `<!-- wp:image -->\n<figure class="wp-block-image"><img src="${token.href}" alt="${token.text || ''}" /></figure>\n<!-- /wp:image -->\n\n`
    } else if (token.type === 'blockquote') {
       const inlineHtml = marked.parseInline(token.text) as string
       blocks += `<!-- wp:quote -->\n<blockquote class="wp-block-quote"><p>${inlineHtml}</p></blockquote>\n<!-- /wp:quote -->\n\n`
    } else if (token.type === 'html') {
       blocks += `<!-- wp:html -->\n${token.text}\n<!-- /wp:html -->\n\n`
    } else {
      // Fallback: wrap raw text in a paragraph block
      if (token.raw.trim()) {
        const inlineHtml = marked.parseInline(token.raw.trim()) as string
        blocks += `<!-- wp:paragraph -->\n<p>${inlineHtml}</p>\n<!-- /wp:paragraph -->\n\n`
      }
    }
  }

  return blocks
}
