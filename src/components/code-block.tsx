"use client";

import { useState } from "react";

/**
 * Lightweight syntax highlighter (no dependencies). Supports the token kinds
 * that appear in lesson content: keywords, strings, comments, numbers,
 * functions, and punctuation for python/js/bash/json.
 */

const KEYWORDS = new Set([
  "def", "return", "import", "from", "as", "if", "else", "elif", "for", "while",
  "in", "not", "and", "or", "class", "lambda", "with", "try", "except", "finally",
  "raise", "print", "None", "True", "False", "const", "let", "var", "function",
  "new", "await", "async", "export", "default", "require", "module",
]);

const TYPES = new Set(["int", "float", "str", "bool", "list", "dict", "tuple", "set"]);

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function tokenize(code: string, lang: string): string {
  const esc = escapeHtml(code);
  const lines = esc.split("\n");

  return lines
    .map((line) => {
      // Comments
      if (lang === "python" || lang === "bash") {
        line = line.replace(/(#.*)$/, '<span class="text-slate-500 italic">$1</span>');
      } else {
        line = line.replace(/(\/\/.*)$/, '<span class="text-slate-500 italic">$1</span>');
      }

      // Strings
      line = line.replace(
        /(&quot;[^&]*?&quot;|&#39;[^&]*?&#39;|"[^"]*"|'[^']*'|`[^`]*`)/g,
        '<span class="text-emerald-300">$1</span>'
      );

      // Numbers
      line = line.replace(/\b(\d+\.?\d*)\b/g, '<span class="text-amber-300">$1</span>');

      // Functions (identifier followed by parenthesis)
      line = line.replace(
        /([a-zA-Z_][a-zA-Z0-9_]*)(?=\()/g,
        '<span class="text-sky-300">$1</span>'
      );

      // Keywords & builtins
      line = line.replace(
        /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g,
        (match, word) => {
          if (KEYWORDS.has(word)) return `<span class="text-violet-300 font-medium">${word}</span>`;
          if (TYPES.has(word)) return `<span class="text-violet-300 font-medium">${word}</span>`;
          return match;
        }
      );

      return line;
    })
    .join("\n");
}

export function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  const html = tokenize(code, lang ?? "");

  return (
    <div className="group relative my-4 overflow-hidden rounded-lg bg-code-bg">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
          {lang || "code"}
        </span>
        <button
          onClick={copy}
          className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring ${
            copied ? "animate-pop text-emerald-300" : ""
          }`}
        >
          {copied ? (
            <>
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
              Tersalin
            </>
          ) : (
            <>
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
              </svg>
              Salin
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-6 text-code-fg">
        <code dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  );
}
