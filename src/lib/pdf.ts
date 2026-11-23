import { readFile } from "node:fs/promises";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, PDFFont, PDFImage, rgb, type RGB } from "pdf-lib";
import type { Recipe } from "@/lib/recipes";

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 48;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const ink = rgb(0.12, 0.1, 0.08);
const muted = rgb(0.4, 0.36, 0.31);
const accent = rgb(0.08, 0.36, 0.28);
const paper = rgb(1, 1, 1);

type Fonts = { regular: PDFFont; bold: PDFFont };
type Kind = "plain" | "bullet" | "number";

type Op =
  | { type: "text"; text: string; x: number; y: number; size: number; font: "regular" | "bold"; color: RGB }
  | { type: "icon"; x: number; y: number; size: number }
  | { type: "photo"; x: number; y: number; width: number; height: number }
  | { type: "bullet"; x: number; y: number; radius: number };

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

  const layout = chooseLayout(recipe, fonts, picture);
  const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  for (const op of layout) {
    if (op.type === "text") {
      page.drawText(op.text, { x: op.x, y: op.y, size: op.size, font: fonts[op.font], color: op.color });
    } else if (op.type === "icon") {
      page.drawImage(icon, { x: op.x, y: op.y, width: op.size, height: op.size });
    } else if (op.type === "photo" && picture) {
      page.drawImage(picture, { x: op.x, y: op.y, width: op.width, height: op.height });
    } else if (op.type === "bullet") {
      page.drawCircle({
        x: op.x,
        y: op.y,
        size: op.radius,
        borderWidth: Math.max(0.7, op.radius * 0.28),
        borderColor: accent,
        color: paper,
      });
    }
  }
  return pdf.save();
}

function chooseLayout(recipe: Recipe, fonts: Fonts, picture: PDFImage | null): Op[] {
  const scales = [1, 0.94, 0.88, 0.82, 0.76, 0.7];
  const photoWidths = picture ? [214, 184, 156, 128, 104] : [0];
  let tightest: Op[] = [];
  let tightestBottom = -Infinity;
  for (const scale of scales) {
    for (const photoWidth of photoWidths) {
      const { ops, bottom } = compose(recipe, fonts, picture, scale, photoWidth);
      if (bottom >= MARGIN) return ops;
      if (bottom > tightestBottom) {
        tightest = ops;
        tightestBottom = bottom;
      }
    }
  }
  return tightest;
}

function compose(
  recipe: Recipe,
  fonts: Fonts,
  picture: PDFImage | null,
  scale: number,
  photoMaxWidth: number,
): { ops: Op[]; bottom: number } {
  const body = 11 * scale;
  const leading = body + 3.4 * scale;
  const titleSize = 21 * scale;
  const titleStep = titleSize + 3 * scale;
  const metaSize = 11.5 * scale;
  const metaStep = metaSize + 2.6 * scale;
  const headSize = 12.5 * scale;
  const gutter = 15 * scale;
  const iconSize = 24 * scale;
  const columnGap = 12 * scale;
  const ops: Op[] = [];
  let y = PAGE_HEIGHT - MARGIN;

  const titleWidth = CONTENT_WIDTH - iconSize - 8 * scale;
  const titleLines = wrap(recipe.title, fonts.bold, titleSize, titleWidth);
  ops.push({
    type: "icon",
    x: MARGIN,
    y: y + titleSize * 0.32 - iconSize / 2,
    size: iconSize,
  });
  for (const line of titleLines) {
    ops.push({ type: "text", text: line, x: MARGIN + iconSize + 8 * scale, y, size: titleSize, font: "bold", color: ink });
    y -= titleStep;
  }
  y -= 3 * scale;

  const timing = [recipe.amount ? `Amount  ${recipe.amount}` : "", recipe.time ? `Time  ${recipe.time}` : ""].filter(
    Boolean,
  );
  for (const line of timing) {
    for (const part of wrap(line, fonts.regular, metaSize, CONTENT_WIDTH)) {
      ops.push({ type: "text", text: part, x: MARGIN, y, size: metaSize, font: "regular", color: ink });
      y -= metaStep;
    }
  }
  if (timing.length > 0) y -= 2 * scale;

  const photo = picture && photoMaxWidth > 0 ? photoBox(picture, photoMaxWidth, recipe.ingredients, fonts, body, leading, gutter, columnGap, scale) : null;

  y = section(recipe.ingredients, "Ingredients", "bullet", y, photo, {
    ops,
    fonts,
    body,
    leading,
    headSize,
    gutter,
    scale,
    columnGap,
  });
  y = section(recipe.directions, "Steps", "number", y, null, {
    ops,
    fonts,
    body,
    leading,
    headSize,
    gutter,
    scale,
    columnGap,
  });
  if (recipe.notes.trim() !== "") {
    y = section([recipe.notes], "Notes", "plain", y, null, {
      ops,
      fonts,
      body,
      leading,
      headSize,
      gutter,
      scale,
      columnGap,
    });
  }
  return { ops, bottom: y };
}

type SectionStyle = {
  ops: Op[];
  fonts: Fonts;
  body: number;
  leading: number;
  headSize: number;
  gutter: number;
  scale: number;
  columnGap: number;
};

function section(blocks: string[], title: string, kind: Kind, y: number, photo: PhotoBox | null, style: SectionStyle): number {
  const filled = blocks.some((block) => block.trim() !== "");
  if (!filled && !photo) return y;
  const { ops, fonts, body, leading, headSize, gutter, scale, columnGap } = style;
  y -= 9 * scale;
  if (filled) {
    ops.push({ type: "text", text: title, x: MARGIN, y, size: headSize, font: "bold", color: accent });
    y -= headSize + 5 * scale;
  }

  const firstBaseline = y;
  if (photo) {
    const top = firstBaseline + body * 0.7;
    ops.push({
      type: "photo",
      x: MARGIN + CONTENT_WIDTH - photo.width,
      y: top - photo.height,
      width: photo.width,
      height: photo.height,
    });
    photo.bottom = top - photo.height;
  }

  blocks.forEach((block, blockIndex) => {
    const paragraphs = block.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
    paragraphs.forEach((paragraph, paragraphIndex) => {
      if (paragraph.trim() === "") {
        y -= leading * 0.45;
        return;
      }
      const prefix = kind === "number" && paragraphIndex === 0 ? `${blockIndex + 1}.  ` : "";
      const words = supported(`${prefix}${paragraph}`, fonts.regular)
        .split(/\s+/)
        .filter((word) => word !== "");
      let firstLine = true;
      while (words.length > 0) {
        const beside = photo ? y + body * 0.15 > photo.bottom : false;
        const column = beside && photo ? CONTENT_WIDTH - photo.width - columnGap : CONTENT_WIDTH;
        const indented = kind === "bullet" || (kind === "number" && !firstLine);
        const lineWidth = Math.max(36, indented ? column - gutter : column);
        const taken = takeWords(words, fonts.regular, body, lineWidth);
        const text = taken.join(" ");
        const x = MARGIN + (indented ? gutter : 0);
        if (kind === "bullet" && firstLine) {
          ops.push({ type: "bullet", x: MARGIN + 4.4 * scale, y: y + body * 0.28, radius: 3 * scale });
        }
        ops.push({ type: "text", text, x, y, size: body, font: "regular", color: ink });
        y -= leading;
        firstLine = false;
        if (taken.length === 0) break;
      }
    });
    y -= 1.6 * scale;
  });

  if (photo) y = Math.min(y, photo.bottom - 4 * scale);
  return y;
}

type PhotoBox = { width: number; height: number; bottom: number };

function photoBox(
  picture: PDFImage,
  maxWidth: number,
  ingredients: string[],
  fonts: Fonts,
  body: number,
  leading: number,
  gutter: number,
  columnGap: number,
  scale: number,
): PhotoBox | null {
  if (ingredients.every((line) => line.trim() === "")) return null;
  const hardHeight = 206 * scale;
  let width = maxWidth;
  let height = (picture.height / picture.width) * width;
  if (height > hardHeight) {
    height = hardHeight;
    width = (picture.width / picture.height) * height;
  }
  for (let pass = 0; pass < 2; pass += 1) {
    const text = ingredientHeight(ingredients, CONTENT_WIDTH - width - columnGap, fonts, body, leading, gutter, scale);
    if (height <= text) break;
    height = text;
    width = (picture.width / picture.height) * height;
  }
  if (width < 24 || height < 24) return null;
  return { width, height, bottom: 0 };
}

function ingredientHeight(
  ingredients: string[],
  column: number,
  fonts: Fonts,
  body: number,
  leading: number,
  gutter: number,
  scale: number,
): number {
  const lineWidth = Math.max(40, column - gutter);
  let height = 0;
  for (const block of ingredients) {
    const paragraphs = block.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
    for (const paragraph of paragraphs) {
      if (paragraph.trim() === "") {
        height += leading * 0.45;
        continue;
      }
      height += wrap(paragraph, fonts.regular, body, lineWidth).length * leading;
    }
    height += 1.6 * scale;
  }
  return Math.max(height, leading);
}

function takeWords(words: string[], font: PDFFont, size: number, width: number): string[] {
  if (words.length === 0) return [];
  const first = words[0];
  if (font.widthOfTextAtSize(first, size) > width) {
    let cut = first.length;
    while (cut > 1 && font.widthOfTextAtSize(first.slice(0, cut), size) > width) cut -= 1;
    words[0] = first.slice(cut);
    return [first.slice(0, cut)];
  }
  const taken: string[] = [];
  while (words.length > 0) {
    const next = taken.length === 0 ? words[0] : `${taken.join(" ")} ${words[0]}`;
    if (font.widthOfTextAtSize(next, size) > width) break;
    taken.push(words.shift() as string);
  }
  return taken;
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
