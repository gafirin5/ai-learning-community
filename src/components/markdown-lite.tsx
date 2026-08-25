"use client";

import { type ReactNode } from "react";
import { CodeBlock } from "@/components/code-block";

/**
 * Minimal markdown renderer supporting the subset used in lesson content:
 * headings (with anchor ids), paragraphs, bold, inline code, fenced code
 * blocks, lists, blockquotes, and tables.
 */

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function extractHeadings(source: string): { id: string; text: string; level: 2 | 3 }[] {
  const headings: { id: string; text: string; level: 2 | 3 }[] = [];
  for (const line of source.split("\n")) {
    const h2 = line.match(/^##\s+(.*)/);
    const h3 = line.match(/^###\s+(.*)/);
    if (h2) headings.push({ id: slugify(h2[1]), text: h2[1].replace(/\*\*/g, ""), level: 2 });
    else if (h3) headings.push({ id: slugify(h3[1]), text: h3[1].replace(/\*\*/g, ""), level: 3 });
  }
  return headings;
}

export function MarkdownLite({ source }: { source: string }) {
  const lines = source.split("\n");
  const nodes: ReactNode[] = [];
  let i = 0;
  let key = 0;

  function renderInline(text: string): ReactNode[] {
    const parts: ReactNode[] = [];
    // Order matters: LaTeX ($math$), images (`![]()`), before links (`[]()`), inline code before
    // both so URLs inside code aren't turned into anchors.
    const regex = /(\$\$[^\$]+\$\$|\$[^\$]+\$|`[^`]+`|\*\*[^*]+\*\*|~~[^~]+~~|!\[[^\]]*\]\([^)\s]+\)|\[[^\]]+\]\([^)\s]+\))/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let k = 0;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      const token = match[0];
      if (token.startsWith("$$")) {
        parts.push(
          <span key={k++} className="font-serif block text-center my-2 text-brand">
            {token.slice(2, -2)}
          </span>
        );
      } else if (token.startsWith("$")) {
        parts.push(
          <span key={k++} className="font-serif italic text-brand">
            {token.slice(1, -1)}
          </span>
        );
      } else if (token.startsWith("`")) {
        parts.push(
          <code key={k++} className="rounded bg-surface-hover px-1.5 py-0.5 text-[13px] text-brand">
            {token.slice(1, -1)}
          </code>
        );
      } else if (token.startsWith("**")) {
        parts.push(
          <strong key={k++} className="font-semibold text-content">
            {token.slice(2, -2)}
          </strong>
        );
      } else if (token.startsWith("~~")) {
        parts.push(
          <del key={k++} className="text-muted line-through">
            {token.slice(2, -2)}
          </del>
        );
      } else if (token.startsWith("![")) {
        const altMatch = token.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
        if (altMatch) {
          parts.push(
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={k++}
              src={altMatch[2]}
              alt={altMatch[1]}
              className="my-2 max-h-80 max-w-full rounded-lg border border-border"
            />
          );
        } else {
          parts.push(token);
        }
      } else {
        const linkMatch = token.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
        if (linkMatch) {
          parts.push(
            <a
              key={k++}
              href={linkMatch[2]}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand hover:underline"
            >
              {linkMatch[1]}
            </a>
          );
        } else {
          parts.push(token);
        }
      }
      lastIndex = match.index + token.length;
    }
    if (lastIndex < text.length) parts.push(text.slice(lastIndex));
    return parts;
  }

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.trimStart().startsWith("```")) {
      const lang = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      nodes.push(<CodeBlock key={key++} code={codeLines.join("\n")} lang={lang || undefined} />);
      continue;
    }

    // Table
    if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
      const headerCells = line.split("|").slice(1, -1).map((c) => c.trim());
      i += 2; // skip separator row
      const rows: string[][] = [];
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) {
        rows.push(lines[i].split("|").slice(1, -1).map((c) => c.trim()));
        i++;
      }
      nodes.push(
        <div key={key++} className="my-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {headerCells.map((c, idx) => (
                  <th key={idx} className="border border-border bg-surface-hover px-3 py-2 text-left font-semibold text-content">
                    {renderInline(c)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rIdx) => (
                <tr key={rIdx}>
                  {row.map((c, cIdx) => (
                    <td key={cIdx} className="border border-border px-3 py-2 text-muted">
                      {renderInline(c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Headings
    const h2 = line.match(/^##\s+(.*)/);
    const h3 = line.match(/^###\s+(.*)/);
    if (h2) {
      nodes.push(<h2 key={key++} id={slugify(h2[1])} className="mt-8 mb-3 text-xl font-bold text-content">{renderInline(h2[1])}</h2>);
      i++;
      continue;
    }
    if (h3) {
      nodes.push(<h3 key={key++} id={slugify(h3[1])} className="mt-6 mb-2 text-lg font-semibold text-content">{renderInline(h3[1])}</h3>);
      i++;
      continue;
    }

    // Blockquote
    if (line.trimStart().startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trimStart().startsWith(">")) {
        quoteLines.push(lines[i].trimStart().replace(/^>\s?/, ""));
        i++;
      }
      nodes.push(
        <blockquote key={key++} className="my-4 border-l-4 border-brand/60 bg-brand-soft px-4 py-3 text-muted">
          {quoteLines.map((q, qi) => (
            <p key={qi} className={qi > 0 ? "mt-2" : ""}>{renderInline(q)}</p>
          ))}
        </blockquote>
      );
      continue;
    }

    // Unordered list
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i++;
      }
      nodes.push(
        <ul key={key++} className="my-3 list-disc space-y-1.5 pl-5">
          {items.map((item, ii) => (
            <li key={ii}>{renderInline(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      nodes.push(
        <ol key={key++} className="my-3 list-decimal space-y-1.5 pl-5">
          {items.map((item, ii) => (
            <li key={ii}>{renderInline(item)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // Blank line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Paragraph
    nodes.push(<p key={key++} className="my-3">{renderInline(line)}</p>);
    i++;
  }

  return <div className="text-[15px] leading-7 text-muted">{nodes}</div>;
}
