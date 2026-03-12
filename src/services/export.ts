import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { Document, Packer, Paragraph, TextRun } from "docx";

export type ExportFormat = "pdf" | "txt" | "docx";

interface ExportOptions {
  inputText: string;
  resultText: string;
  mode: "translate" | "summarize";
  targetLanguage?: string;
}

const stripHtml = (html: string): string => {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || "";
};

/**
 * Check if text contains Arabic characters
 */
const containsArabic = (text: string): boolean => {
  const arabicPattern =
    /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return arabicPattern.test(text);
};

/**
 * Export result to TXT file
 */
export const exportToTxt = (options: ExportOptions): void => {
  const { mode, targetLanguage } = options;
  const inputPlain = stripHtml(options.inputText);
  const resultPlain = stripHtml(options.resultText);

  let content = `3ssila AI - ${
    mode === "translate" ? "Translation" : "Summary"
  } Export\n`;
  content += `${"=".repeat(50)}\n\n`;
  content += `Date: ${new Date().toLocaleString()}\n`;
  if (mode === "translate" && targetLanguage) {
    content += `Target Language: ${targetLanguage}\n`;
  }
  content += `\n${"=".repeat(50)}\n\n`;
  content += `ORIGINAL TEXT:\n${"-".repeat(30)}\n${inputPlain}\n\n`;
  content += `${
    mode === "translate" ? "TRANSLATED" : "SUMMARIZED"
  } TEXT:\n${"-".repeat(30)}\n${resultPlain}\n`;

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  downloadBlob(blob, `3ssila-${mode}-${Date.now()}.txt`);
};

/**
 * Build an off-screen container that renders HTML content for capture.
 */
const buildHtmlContainer = (
  inputHtml: string,
  resultHtml: string,
  mode: "translate" | "summarize",
  targetLanguage?: string,
): HTMLDivElement => {
  const isArabic = containsArabic(inputHtml) || containsArabic(resultHtml);
  const dir = isArabic ? "rtl" : "ltr";

  const container = document.createElement("div");
  container.style.cssText =
    "width:700px;padding:40px;background:#fff;color:#000;font-family:Arial,sans-serif;font-size:14px;line-height:1.6;";
  container.setAttribute("dir", dir);

  const title = `3ssila AI - ${mode === "translate" ? "Translation" : "Summary"}`;
  const date = new Date().toLocaleString();
  const langLine =
    mode === "translate" && targetLanguage
      ? `<p style="color:#666;font-size:12px;">Target Language: ${targetLanguage}</p>`
      : "";

  container.innerHTML = `
    <h1 style="font-size:22px;font-weight:bold;margin-bottom:4px;color:#000;">${title}</h1>
    <p style="color:#666;font-size:12px;margin-bottom:0;">Date: ${date}</p>
    ${langLine}
    <hr style="margin:16px 0;border:none;border-top:1px solid #ccc;">
    <h2 style="font-size:16px;font-weight:bold;margin-bottom:8px;color:#000;">Original Text</h2>
    <div class="tiptap-content" style="margin-bottom:24px;color:#000;">${inputHtml}</div>
    <h2 style="font-size:16px;font-weight:bold;margin-bottom:8px;color:#000;">${mode === "translate" ? "Translated" : "Summarized"} Text</h2>
    <div class="tiptap-content" style="color:#000;">${resultHtml}</div>
  `;

  // Inline styles on all elements so html2canvas doesn't rely on inherited CSS
  container.querySelectorAll(".tiptap-content table").forEach((table) => {
    (table as HTMLElement).style.cssText =
      "width:100%;border-collapse:collapse;margin:8px 0;font-size:13px;color:#000;";
  });
  container
    .querySelectorAll(".tiptap-content th, .tiptap-content td")
    .forEach((cell) => {
      (cell as HTMLElement).style.cssText =
        "padding:6px 10px;border:1px solid #d1d5db;text-align:left;color:#000;background:#fff;";
    });
  container.querySelectorAll(".tiptap-content th").forEach((th) => {
    (th as HTMLElement).style.background = "#f3f4f6";
    (th as HTMLElement).style.fontWeight = "600";
    (th as HTMLElement).style.color = "#000";
  });
  container.querySelectorAll(".tiptap-content blockquote").forEach((bq) => {
    (bq as HTMLElement).style.cssText =
      "border-left:4px solid #22d3ee;padding-left:12px;font-style:italic;margin:8px 0;color:#000;";
  });
  container.querySelectorAll(".tiptap-content ul").forEach((ul) => {
    (ul as HTMLElement).style.cssText =
      "list-style-type:disc;padding-left:24px;margin-bottom:8px;color:#000;";
  });
  container.querySelectorAll(".tiptap-content ol").forEach((ol) => {
    (ol as HTMLElement).style.cssText =
      "list-style-type:decimal;padding-left:24px;margin-bottom:8px;color:#000;";
  });
  container.querySelectorAll(".tiptap-content code").forEach((code) => {
    (code as HTMLElement).style.cssText =
      "background:#f3f4f6;padding:1px 4px;border-radius:3px;font-size:13px;font-family:monospace;color:#000;";
  });
  container.querySelectorAll(".tiptap-content pre").forEach((pre) => {
    (pre as HTMLElement).style.cssText =
      "background:#f3f4f6;padding:12px;border-radius:6px;margin:8px 0;overflow-x:auto;color:#000;";
  });
  container
    .querySelectorAll(
      ".tiptap-content h1, .tiptap-content h2, .tiptap-content h3",
    )
    .forEach((h) => {
      (h as HTMLElement).style.color = "#000";
    });
  container
    .querySelectorAll(
      ".tiptap-content p, .tiptap-content li, .tiptap-content span",
    )
    .forEach((el) => {
      (el as HTMLElement).style.color = "#000";
    });

  return container;
};

/**
 * Render the container inside an isolated iframe so html2canvas
 * doesn't encounter oklch() colors from Tailwind's stylesheets.
 */
const renderInIframe = (
  container: HTMLDivElement,
): { iframe: HTMLIFrameElement; root: HTMLDivElement } => {
  const iframe = document.createElement("iframe");
  iframe.style.cssText =
    "position:fixed;left:-9999px;top:0;width:800px;height:600px;border:none;";
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument!;
  iframeDoc.open();
  iframeDoc.write(
    "<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box;}</style></head><body></body></html>",
  );
  iframeDoc.close();

  iframeDoc.body.appendChild(container);
  return { iframe, root: container };
};

/**
 * Export result to PDF file — renders HTML visually (tables, formatting, etc.)
 */
export const exportToPdf = async (options: ExportOptions): Promise<void> => {
  const { inputText, resultText, mode, targetLanguage } = options;

  const container = buildHtmlContainer(
    inputText,
    resultText,
    mode,
    targetLanguage,
  );
  const { iframe, root } = renderInIframe(container);

  try {
    const canvas = await html2canvas(root, {
      scale: 2,
      useCORS: true,
      logging: false,
      windowWidth: 800,
    });

    const imgData = canvas.toDataURL("image/png");
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    // A4 dimensions in mm
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfPageWidth = pdf.internal.pageSize.getWidth();
    const pdfPageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pdfPageWidth - margin * 2;
    const contentHeight = (imgHeight * contentWidth) / imgWidth;

    // Split across pages if the content is taller than one page
    const usableHeight = pdfPageHeight - margin * 2 - 10; // 10mm for footer
    let remainingHeight = contentHeight;
    let sourceY = 0;
    let page = 0;

    while (remainingHeight > 0) {
      if (page > 0) pdf.addPage();

      const sliceHeight = Math.min(usableHeight, remainingHeight);
      // Calculate the corresponding source region on the canvas
      const sourceSliceHeight = (sliceHeight / contentHeight) * imgHeight;

      // Create a temporary canvas for this page slice
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = imgWidth;
      pageCanvas.height = sourceSliceHeight;
      const ctx = pageCanvas.getContext("2d")!;
      ctx.drawImage(
        canvas,
        0,
        sourceY,
        imgWidth,
        sourceSliceHeight,
        0,
        0,
        imgWidth,
        sourceSliceHeight,
      );

      const pageImgData = pageCanvas.toDataURL("image/png");
      pdf.addImage(
        pageImgData,
        "PNG",
        margin,
        margin,
        contentWidth,
        sliceHeight,
      );

      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(150);
      pdf.text("Generated by 3ssila AI", pdfPageWidth / 2, pdfPageHeight - 5, {
        align: "center",
      });

      sourceY += sourceSliceHeight;
      remainingHeight -= sliceHeight;
      page++;
    }

    pdf.save(`3ssila-${mode}-${Date.now()}.pdf`);
  } finally {
    document.body.removeChild(iframe);
  }
};

/**
 * Export result to DOCX file
 */
export const exportToDocx = async (options: ExportOptions): Promise<void> => {
  const { mode, targetLanguage } = options;
  const inputText = stripHtml(options.inputText);
  const resultText = stripHtml(options.resultText);

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Title
          new Paragraph({
            children: [
              new TextRun({
                text: `3ssila AI - ${
                  mode === "translate" ? "Translation" : "Summary"
                }`,
                bold: true,
                size: 36,
              }),
            ],
            spacing: { after: 200 },
          }),
          // Date
          new Paragraph({
            children: [
              new TextRun({
                text: `Date: ${new Date().toLocaleString()}`,
                size: 20,
                color: "666666",
              }),
            ],
          }),
          // Target language (if translation)
          ...(mode === "translate" && targetLanguage
            ? [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Target Language: ${targetLanguage}`,
                      size: 20,
                      color: "666666",
                    }),
                  ],
                  spacing: { after: 400 },
                }),
              ]
            : [
                new Paragraph({
                  children: [],
                  spacing: { after: 400 },
                }),
              ]),
          // Original text header
          new Paragraph({
            children: [
              new TextRun({
                text: "Original Text:",
                bold: true,
                size: 24,
              }),
            ],
            spacing: { after: 100 },
          }),
          // Original text content
          ...inputText.split("\n").map(
            (line) =>
              new Paragraph({
                children: [
                  new TextRun({
                    text: line,
                    size: 22,
                  }),
                ],
              }),
          ),
          // Spacer
          new Paragraph({
            children: [],
            spacing: { after: 400 },
          }),
          // Result header
          new Paragraph({
            children: [
              new TextRun({
                text: `${
                  mode === "translate" ? "Translated" : "Summarized"
                } Text:`,
                bold: true,
                size: 24,
              }),
            ],
            spacing: { after: 100 },
          }),
          // Result content
          ...resultText.split("\n").map(
            (line) =>
              new Paragraph({
                children: [
                  new TextRun({
                    text: line,
                    size: 22,
                  }),
                ],
              }),
          ),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `3ssila-${mode}-${Date.now()}.docx`);
};

/**
 * Helper function to download a blob as a file
 */
const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export result to the specified format
 */
export const exportResult = async (
  format: ExportFormat,
  options: ExportOptions,
): Promise<void> => {
  switch (format) {
    case "txt":
      exportToTxt(options);
      break;
    case "pdf":
      await exportToPdf(options);
      break;
    case "docx":
      await exportToDocx(options);
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
};
