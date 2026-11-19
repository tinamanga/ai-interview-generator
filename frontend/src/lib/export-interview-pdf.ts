import { jsPDF } from "jspdf";

import type { SavedInterview } from "@/lib/interview-api";

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 18;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FOOTER_LIMIT = 278;

function normalizePdfText(value: string): string {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/•/g, "-")
    .replace(/[^\x09\x0A\x0D\x20-\xFF]/g, "?");
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatLabel(value: string): string {
  const labels: Record<string, string> = {
    JUNIOR: "Junior",
    MID: "Mid-level",
    SENIOR: "Senior",
    TECHNICAL: "Technical",
    BEHAVIORAL: "Behavioral",
    MIXED: "Mixed",
    EASY: "Easy",
    MEDIUM: "Medium",
    HARD: "Hard",
  };

  return labels[value] ?? value;
}

function createFileName(jobTitle: string): string {
  const slug = normalizePdfText(jobTitle)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return `interviewiq-${slug || "interview"}.pdf`;
}

export function exportInterviewPdf(interview: SavedInterview): void {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  pdf.setProperties({
    title: `Interview Questions - ${interview.jobTitle}`,
    subject: "Generated interview preparation questions",
    author: "InterviewIQ",
    creator: "InterviewIQ",
  });

  let y = 20;

  // Start a new page and add a small continuation header.
  function addPage(): void {
    pdf.addPage();
    y = 20;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(79, 70, 229);
    pdf.text("INTERVIEWIQ", MARGIN, y);

    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 116, 139);
    pdf.text("Interview preparation", PAGE_WIDTH - MARGIN, y, {
      align: "right",
    });

    y += 5;

    pdf.setDrawColor(226, 232, 240);
    pdf.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);

    y += 9;
  }

  function ensureSpace(requiredHeight: number): void {
    if (y + requiredHeight > FOOTER_LIMIT) {
      addPage();
    }
  }

  // Wrap text to the available width and continue across pages when necessary.
  function writeParagraph(
    value: string,
    options: {
      fontSize?: number;
      bold?: boolean;
      color?: [number, number, number];
      after?: number;
      lineHeight?: number;
    } = {},
  ): void {
    const {
      fontSize = 10,
      bold = false,
      color = [51, 65, 85],
      after = 3,
      lineHeight = fontSize * 0.48,
    } = options;

    pdf.setFont("helvetica", bold ? "bold" : "normal");
    pdf.setFontSize(fontSize);
    pdf.setTextColor(...color);

    const normalized = normalizePdfText(value);
    const paragraphs = normalized.split("\n");

    for (const paragraph of paragraphs) {
      const lines = pdf.splitTextToSize(
        paragraph || " ",
        CONTENT_WIDTH,
      ) as string[];

      for (const line of lines) {
        ensureSpace(lineHeight);
        pdf.text(line, MARGIN, y);
        y += lineHeight;
      }
    }

    y += after;
  }

  function writeSectionHeading(value: string): void {
    ensureSpace(12);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.setTextColor(30, 41, 59);
    pdf.text(normalizePdfText(value), MARGIN, y);

    y += 8;
  }

  // First-page branding.
  pdf.setFillColor(79, 70, 229);
  pdf.rect(0, 0, PAGE_WIDTH, 7, "F");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(79, 70, 229);
  pdf.text("INTERVIEWIQ", MARGIN, y);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(100, 116, 139);
  pdf.text("INTERVIEW PREPARATION", PAGE_WIDTH - MARGIN, y, {
    align: "right",
  });

  y += 14;

  writeParagraph(interview.jobTitle, {
    fontSize: 22,
    bold: true,
    color: [15, 23, 42],
    after: 5,
    lineHeight: 10,
  });

  writeParagraph(`Created: ${formatDate(interview.createdAt)}`, {
    fontSize: 9,
    color: [100, 116, 139],
    after: 5,
  });

  writeParagraph(
    `Interview type: ${formatLabel(interview.interviewType)}    |    Experience level: ${formatLabel(interview.experienceLevel)}`,
    {
      fontSize: 9,
      bold: true,
      color: [79, 70, 229],
      after: 3,
    },
  );

  writeParagraph(
    `Questions: ${interview.questions.length}`,
    {
      fontSize: 9,
      color: [100, 116, 139],
      after: 7,
    },
  );

  if (interview.jobDescription.trim()) {
    writeSectionHeading("Job description");

    writeParagraph(interview.jobDescription, {
      fontSize: 10,
      color: [71, 85, 105],
      after: 7,
      lineHeight: 5,
    });
  }

  writeSectionHeading("Generated interview questions");

  if (interview.questions.length === 0) {
    writeParagraph("No questions are available for this interview.", {
      fontSize: 10,
    });
  }

  for (const [index, question] of interview.questions.entries()) {
    ensureSpace(24);

    pdf.setDrawColor(226, 232, 240);
    pdf.line(MARGIN, y - 2, PAGE_WIDTH - MARGIN, y - 2);

    writeParagraph(`QUESTION ${question.position || index + 1}`, {
      fontSize: 9,
      bold: true,
      color: [79, 70, 229],
      after: 3,
    });

    writeParagraph(question.question, {
      fontSize: 11,
      bold: true,
      color: [15, 23, 42],
      after: 4,
      lineHeight: 5.5,
    });

    writeParagraph(
      `Category: ${question.category}    |    Difficulty: ${formatLabel(question.difficulty)}`,
      {
        fontSize: 9,
        bold: true,
        color: [71, 85, 105],
        after: 4,
      },
    );

    writeParagraph("Evaluation criteria", {
      fontSize: 9,
      bold: true,
      color: [30, 41, 59],
      after: 2,
    });

    writeParagraph(question.evaluationCriteria, {
      fontSize: 9,
      color: [71, 85, 105],
      after: 9,
      lineHeight: 4.8,
    });
  }

  // Add consistent page numbers after all pages have been generated.
  const totalPages = pdf.getNumberOfPages();

  for (let page = 1; page <= totalPages; page += 1) {
    pdf.setPage(page);

    pdf.setDrawColor(226, 232, 240);
    pdf.line(
      MARGIN,
      PAGE_HEIGHT - 15,
      PAGE_WIDTH - MARGIN,
      PAGE_HEIGHT - 15,
    );

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184);

    pdf.text("Generated by InterviewIQ", MARGIN, PAGE_HEIGHT - 9);

    pdf.text(
      `Page ${page} of ${totalPages}`,
      PAGE_WIDTH - MARGIN,
      PAGE_HEIGHT - 9,
      { align: "right" },
    );
  }

  pdf.save(createFileName(interview.jobTitle));
}
