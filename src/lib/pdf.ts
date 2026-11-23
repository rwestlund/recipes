import { readFile } from "node:fs/promises";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, PDFFont, PDFImage, rgb, type RGB } from "pdf-lib";
import type { Recipe } from "@/lib/recipes";

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 54;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const ink = rgb(0.12, 0.1, 0.08);
const muted = rgb(0.4, 0.36, 0.31);
const accent = rgb(0.08, 0.36, 0.28);

type Fonts = { regular: PDFFont; bold: PDFFont };

export async function renderRecipePdf(recipe: Recipe, photo: Uint8Array | null = null): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const regular = await pdf.embedFont(await readFile(fontPath("SourceSans3-Regular.ttf")), { subset: true });
  const bold = await pdf.embedFont(await readFile(fontPath("SourceSans3-Semibold.ttf")), { subset: true });
  const fonts = { regular, bold };
  const icon = await embedMark(pdf);
  const picture = await embedPhoto(pdf, photo);
  pdf.setTitle(recipe.title);
  pdf.setAuthor("Recipes");
  pdf.setCreator("Recipes");

  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  const newPage = () => {
    page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN;
    const running = fit(recipe.title, fonts.regular, 10, CONTENT_WIDTH);
    page.drawText(running, { x: MARGIN, y, size: 10, font: fonts.regular, color: muted });
    y -= 22;
  };

  const ensure = (height: number) => {
    if (y - height < MARGIN) newPage();
  };

  const drawLines = (lines: string[], font: PDFFont, size: number, color: RGB, indent = 0, gap = 3) => {
    for (const line of lines) {
      ensure(size + gap);
      if (line !== "") {
        page.drawText(line, { x: MARGIN + indent, y, size, font, color });
      }
      y -= size + gap;
    }
  };

  const iconSize = 26;
  const titleGap = 10;
  const titleSize = 22;
  const titleLines = wrap(recipe.title, fonts.bold, titleSize, CONTENT_WIDTH - iconSize - titleGap);
  const titleStep = titleSize + 4;
  ensure(Math.max(iconSize, titleLines.length * titleStep));
  page.drawImage(icon, {
    x: MARGIN,
    y: y + titleSize * 0.32 - iconSize / 2,
    width: iconSize,
    height: iconSize,
  });
  for (const line of titleLines) {
    page.drawText(line, {
      x: MARGIN + iconSize + titleGap,
      y,
      size: titleSize,
      font: fonts.bold,
      color: ink,
    });
    y -= titleStep;
  }
  y -= 6;

  const timing = [recipe.amount ? `Amount  ${recipe.amount}` : "", recipe.time ? `Time  ${recipe.time}` : ""].filter(
    Boolean,
  );
  if (timing.length > 0) {
    for (const line of timing) {
      drawLines(wrap(line, fonts.regular, 12, CONTENT_WIDTH), fonts.regular, 12, ink, 0, 3);
    }
    y -= 8;
  }

  if (picture) {
    const maxHeight = 210;
    let width = CONTENT_WIDTH;
    let height = (picture.height / picture.width) * width;
    if (height > maxHeight) {
      height = maxHeight;
      width = (picture.width / picture.height) * height;
    }
    ensure(height + 8);
    page.drawImage(picture, {
      x: MARGIN + (CONTENT_WIDTH - width) / 2,
      y: y - height,
      width,
      height,
    });
    y -= height + 14;
  }

  section("Ingredients", recipe.ingredients, "bullet");
  section("Steps", recipe.directions, "number");
  if (recipe.notes.trim() !== "") {
    section("Notes", [recipe.notes], "plain");
  }

  const pages = pdf.getPages();
  if (pages.length > 1) {
    pages.forEach((item, index) => {
      item.drawText(String(index + 1), {
        x: PAGE_WIDTH - MARGIN - 8,
        y: 28,
        size: 9,
        font: fonts.regular,
        color: muted,
      });
    });
  }

  return pdf.save();

  function section(title: string, blocks: string[], kind: "plain" | "bullet" | "number") {
    if (blocks.length === 0) return;
    ensure(36);
    y -= 10;
    page.drawText(title, { x: MARGIN, y, size: 13, font: fonts.bold, color: accent });
    y -= 18;
    const gutter = kind === "plain" ? 0 : 18;
    blocks.forEach((block, blockIndex) => {
      const paragraphs = block.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
      paragraphs.forEach((paragraph, paragraphIndex) => {
        if (paragraph.trim() === "") {
          y -= 8;
          return;
        }
        const prefix = kind === "number" && paragraphIndex === 0 ? `${blockIndex + 1}.  ` : "";
        const lines = wrap(`${prefix}${paragraph}`, fonts.regular, 11, CONTENT_WIDTH - gutter);
        lines.forEach((line, lineIndex) => {
          ensure(15);
          const hung = kind === "bullet" || (kind === "number" && (lineIndex > 0 || paragraphIndex > 0));
          if (kind === "bullet" && paragraphIndex === 0 && lineIndex === 0) {
            page.drawCircle({
              x: MARGIN + 4.5,
              y: y + 3.2,
              size: 3.1,
              borderWidth: 0.9,
              borderColor: accent,
              color: rgb(1, 1, 1),
            });
          }
          page.drawText(line, { x: MARGIN + (hung ? gutter : 0), y, size: 11, font: fonts.regular, color: ink });
          y -= 15;
        });
      });
      y -= 4;
    });
  }
}

async function embedMark(pdf: PDFDocument): Promise<PDFImage> {
  const sharp = (await import("sharp")).default;
  const png = await sharp(path.join(process.cwd(), "public", "mark.svg")).resize(128, 128).png().toBuffer();
  return pdf.embedPng(png);
}

async function embedPhoto(pdf: PDFDocument, photo: Uint8Array | null): Promise<PDFImage | null> {
  if (!photo || photo.length < 3 || photo[0] !== 0xff || photo[1] !== 0xd8) return null;
  return pdf.embedJpg(photo);
}

function fontPath(name: string): string {
  return path.join(process.cwd(), "assets", "fonts", name);
}

function fit(text: string, font: PDFFont, size: number, width: number): string {
  const clean = supported(text, font).replace(/\s+/g, " ").trim();
  if (font.widthOfTextAtSize(clean, size) <= width) return clean;
  let low = 0;
  let high = clean.length;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    const slice = `${clean.slice(0, mid).trimEnd()}…`;
    if (font.widthOfTextAtSize(slice, size) <= width) low = mid;
    else high = mid - 1;
  }
  return `${clean.slice(0, low).trimEnd()}…`;
}

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const clean = supported(text, font);
  const words = clean.split(/\s+/).filter((word) => word !== "");
  const lines: string[] = [];
  let line = "";
  const pushWord = (word: string) => {
    if (font.widthOfTextAtSize(word, size) <= width) {
      if (line === "") line = word;
      else {
        lines.push(line);
        line = word;
      }
      return;
    }
    if (line !== "") {
      lines.push(line);
      line = "";
    }
    let rest = word;
    while (rest !== "") {
      let cut = rest.length;
      while (cut > 1 && font.widthOfTextAtSize(rest.slice(0, cut), size) > width) cut -= 1;
      lines.push(rest.slice(0, cut));
      rest = rest.slice(cut);
      if (font.widthOfTextAtSize(rest, size) <= width) {
        line = rest;
        rest = "";
      }
    }
  };
  for (const word of words) {
    const next = line === "" ? word : `${line} ${word}`;
    if (font.widthOfTextAtSize(next, size) <= width) line = next;
    else pushWord(word);
  }
  if (line !== "") lines.push(line);
  return lines.length > 0 ? lines : [""];
}

function supported(text: string, font: PDFFont): string {
  let out = "";
  for (const ch of text) {
    if (ch === "\n" || ch === "\r" || ch === "\t") {
      out += " ";
      continue;
    }
    try {
      font.widthOfTextAtSize(ch, 12);
      out += ch;
    } catch {
      out += "?";
    }
  }
  return out;
}
