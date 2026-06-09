import React, { useRef, useState, useEffect } from 'react';
import { marked } from 'marked';

// Lazy load marked-katex-extension to avoid initialization errors
let markedKatex: any = null;
let katexLoaded = false;
let katexLoadingPromise: Promise<void> | null = null;

const loadKatex = async () => {
  if (katexLoaded) return;
  if (katexLoadingPromise) return katexLoadingPromise;

  katexLoadingPromise = (async () => {
    try {
      const markedKatexModule = await import('marked-katex-extension');
      markedKatex = markedKatexModule.default || markedKatexModule;

      // Configure marked-katex-extension with proper options
      // The extension automatically handles $...$ and $$...$$ syntax
      marked.use(markedKatex({
        throwOnError: false,
        errorColor: '#cc0000',
        output: 'html',
        // Don't set displayMode here - let the extension handle it based on $ vs $$
      }));
      katexLoaded = true;
      console.log('KaTeX extension loaded successfully');
    } catch (error) {
      console.warn('Failed to load KaTeX extension:', error);
    }
  })();

  return katexLoadingPromise;
};

// Configure marked options
marked.setOptions({
  breaks: true,
  gfm: true
});

// Preprocess LaTeX in text to ensure proper formatting
const preprocessLatex = (text: string): string => {
  // Fix escaped dollar signs from AI output (\$ -> $)
  let processed = text.replace(/\\\$/g, '$');

  // Fix common LaTeX delimiters that marked-katex might miss
  // \[ ... \] -> $$ ... $$
  processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, '$$$1$$');
  
  // \( ... \) -> $ ... $
  processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');

  // Process block math ($$...$$) first - ensure proper line breaks
  processed = processed.replace(/\$\$\s*\n?/g, '\n$$\n');
  processed = processed.replace(/\n?\s*\$\$/g, '\n$$\n');

  // Process inline math ($...$) - ensure spaces around single $
  // Use a more careful approach to avoid matching $$ blocks
  const lines = processed.split('\n');
  const result = lines.map(line => {
    // Skip lines that are part of block math (start or end with $$)
    if (line.trim().startsWith('$$') || line.trim().endsWith('$$')) {
      return line;
    }

    // Process inline math in this line
    // Match single $ that are not part of $$
    return line.replace(/(?<!\$)\$(?!\$)([^$\n]+?)(?<!\$)\$(?!\$)/g, (match, content) => {
      // Ensure spaces around the inline math
      return ` $${content.trim()}$ `;
    });
  });

  processed = result.join('\n');

  // Clean up multiple spaces but preserve newlines
  processed = processed.replace(/[ \t]+/g, ' ');

  // Ensure there are empty lines around block math for marked-katex-extension
  processed = processed.replace(/\n?\$\$\n?/g, '\n\n$$\n\n');
  processed = processed.replace(/\n{3,}/g, '\n\n');

  return processed.trim();
};

// Safely parse markdown with error handling
const safeParseMarkdown = async (text: string): Promise<string> => {
  try {
    // Ensure KaTeX is loaded before parsing
    await loadKatex();

    // Preprocess LaTeX
    const processedText = preprocessLatex(text);

    // Parse Markdown to HTML
    let html = marked.parse(processedText) as string;

    // Process demo links to add data attributes and styling
    // Handle AI-generated links with onclick attributes
    html = html.replace(
      /<a\s+[^>]*href="#\/demo\/([^"]+)"[^>]*>([^<]*)<\/a>/gi,
      '<a href="#/demo/$1" class="text-indigo-600 underline cursor-pointer hover:text-indigo-800" data-demo-id="$1" style="color: #4f46e5; text-decoration: underline; cursor: pointer;">$2</a>'
    );

    // Handle any remaining markdown-style links [text](#/demo/id)
    html = html.replace(
      /\[([^\]]+)\]\(#\/demo\/([^)]+)\)/g,
      '<a href="#/demo/$2" class="text-indigo-600 underline cursor-pointer hover:text-indigo-800" data-demo-id="$2" style="color: #4f46e5; text-decoration: underline; cursor: pointer;">$1</a>'
    );

	    // Handle demo:// style links [text](demo://id)
	    html = html.replace(
	      /<a\s+[^>]*href="demo:\/\/([^"]+)"[^>]*>(.*?)<\/a>/gi,
	      '<a href="#/demo/$1" class="text-indigo-600 underline cursor-pointer hover:text-indigo-800" data-demo-id="$1" style="color: #4f46e5; text-decoration: underline; cursor: pointer;">$2</a>'
	    );

	    // Handle demo:// style links before markdown parsing fallback
	    html = html.replace(
	      /\[([^\]]+)\]\(demo:\/\/([^)]+)\)/g,
	      '<a href="#/demo/$2" class="text-indigo-600 underline cursor-pointer hover:text-indigo-800" data-demo-id="$2" style="color: #4f46e5; text-decoration: underline; cursor: pointer;">$1</a>'
	    );

    // Handle raw demo:// links
    html = html.replace(
      /demo:\/\/([a-zA-Z0-9_-]+)/g,
      '<a href="#/demo/$1" class="text-indigo-600 underline cursor-pointer hover:text-indigo-800" data-demo-id="$1" style="color: #4f46e5; text-decoration: underline; cursor: pointer;">$1</a>'
    );

    return html;
  } catch (error) {
    console.error('Error parsing Markdown:', error);
    // Return escaped plain text as fallback
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\n/g, '<br>');
  }
};

interface AIMessageContentProps {
  text: string;
  onOpenDemo?: (demoId: string) => void;
  isStreaming?: boolean;
}

export const AIMessageContent: React.FC<AIMessageContentProps> = ({ text, onOpenDemo, isStreaming }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [processedHtml, setProcessedHtml] = useState<string>('');
  const lastTextRef = useRef<string>('');

  // Handle link clicks
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleLinkClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');

      if (link) {
        e.preventDefault();
        e.stopPropagation();

        const demoId = link.getAttribute('data-demo-id') ||
                      link.getAttribute('href')?.replace('#/demo/', '');

        if (demoId && demoId !== 'DEMO_ID' && demoId !== 'ACTUAL_DEMO_ID' && demoId.trim()) {
          console.log('Opening demo:', demoId);
          onOpenDemo?.(demoId);
        } else {
          console.warn('Invalid demo ID:', demoId);
        }
      }
    };

    container.addEventListener('click', handleLinkClick);
    return () => container.removeEventListener('click', handleLinkClick);
  }, [onOpenDemo]);

  // Parse markdown when text changes (even during streaming)
  useEffect(() => {
    if (text && text !== lastTextRef.current) {
      lastTextRef.current = text;
      safeParseMarkdown(text).then(html => {
        setProcessedHtml(html);
      });
    }
  }, [text]);

  // Initial parse for existing messages from localStorage
  useEffect(() => {
    if (text && !processedHtml) {
      lastTextRef.current = text;
      safeParseMarkdown(text).then(html => {
        setProcessedHtml(html);
      });
    }
  }, []);

  // If no HTML yet, render raw text (maybe with simple formatting)
  if (!processedHtml) {
    return (
      <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap font-sans break-words overflow-wrap-anywhere">
        {text}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="prose prose-sm max-w-none text-slate-700 [&>p]:mb-2 [&>ul]:mb-2 [&>ol]:mb-2 break-words overflow-wrap-anywhere"
      dangerouslySetInnerHTML={{ __html: processedHtml }}
    />
  );
};
