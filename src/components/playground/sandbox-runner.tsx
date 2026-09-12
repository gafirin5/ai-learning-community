"use client";

import { useEffect, useRef, useState } from "react";
import type { OutputLine } from "./output-panel";

interface SandboxRunnerProps {
  code: string;
  // Method-signature (bukan arrow-type) supaya plugin TS Next.js tidak
  // salah anggap ini melanggar aturan serializable props "use client".
  onLine(line: OutputLine): void;
  onDone(): void;
}

interface PlaygroundMessage {
  __playground?: boolean;
  nonce?: string;
  kind?: "log" | "warn" | "error" | "done";
  text?: string;
}

let nonceCounter = 0;

function createNonce(): string {
  nonceCounter += 1;
  return `pg-${Date.now()}-${nonceCounter}-${Math.random().toString(36).slice(2)}`;
}

// Kode user di-embed sebagai literal string JSON, lalu di-eval via `new Function`
// DI DALAM iframe sandbox (bukan di scope halaman utama). "</script" perlu
// di-escape supaya tidak memutus tag <script> yang membungkusnya di srcDoc.
function escapeForScriptTag(json: string): string {
  return json.replace(/<\/script/gi, "<\\/script");
}

function buildSrcDoc(code: string, nonce: string): string {
  const codeJson = escapeForScriptTag(JSON.stringify(code));
  const nonceJson = JSON.stringify(nonce);

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body>
<script>
(function () {
  var NONCE = ${nonceJson};

  function safeStringify(value) {
    if (typeof value === "string") return value;
    if (value instanceof Error) return value.message;
    try {
      return JSON.stringify(value, null, 2);
    } catch (e) {
      return String(value);
    }
  }

  function send(kind, text) {
    try {
      window.parent.postMessage({ __playground: true, nonce: NONCE, kind: kind, text: text }, "*");
    } catch (e) {
      /* noop */
    }
  }

  console.log = function () {
    send("log", Array.prototype.map.call(arguments, safeStringify).join(" "));
  };
  console.warn = function () {
    send("warn", Array.prototype.map.call(arguments, safeStringify).join(" "));
  };
  console.error = function () {
    send("error", Array.prototype.map.call(arguments, safeStringify).join(" "));
  };
  window.onerror = function (message) {
    send("error", String(message));
    return true;
  };

  try {
    var userCode = ${codeJson};
    var runUserCode = new Function(userCode);
    runUserCode();
  } catch (err) {
    send("error", err && err.message ? err.message : String(err));
  }

  send("done", "");
})();
</script>
</body>
</html>`;
}

/**
 * Menjalankan kode JavaScript milik user di dalam iframe sandbox terisolasi
 * (`allow-scripts` saja, tanpa `allow-same-origin`) sehingga tidak punya akses
 * ke DOM/state halaman utama. Setiap instance dibuat dengan nonce unik agar
 * pesan `postMessage` yang masuk bisa dicocokkan ke run yang benar; remount
 * komponen ini (misal via `key`) untuk memastikan state JS run sebelumnya
 * tidak bocor ke run berikutnya.
 */
export function SandboxRunner({ code, onLine, onDone }: SandboxRunnerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [nonce] = useState(createNonce);

  useEffect(() => {
    function handleMessage(event: MessageEvent<PlaygroundMessage>) {
      const data = event.data;
      if (!data || data.__playground !== true || data.nonce !== nonce) return;
      if (event.source !== iframeRef.current?.contentWindow) return;

      if (data.kind === "done") {
        onDone();
        return;
      }
      if (data.kind === "log" || data.kind === "warn" || data.kind === "error") {
        onLine({
          id: `${nonce}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          kind: data.kind,
          text: data.text ?? "",
        });
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [nonce, onLine, onDone]);

  return (
    <iframe
      ref={iframeRef}
      title="Sandbox eksekusi kode playground"
      sandbox="allow-scripts"
      srcDoc={buildSrcDoc(code, nonce)}
      className="hidden"
      aria-hidden="true"
      tabIndex={-1}
    />
  );
}
