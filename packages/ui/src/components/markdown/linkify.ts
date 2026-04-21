const URL_REGEX = /(?:https?:\/\/)[^\s<>)\]"',]+/g;
const FILE_PATH_REGEX =
  /(?:^|[\s([{<])((\/|~\/|\.\/)[\w\-./@]+\.(?:ts|tsx|js|jsx|mjs|cjs|md|json|yaml|yml|py|go|rs|css|scss|less|html|htm|txt|log|sh|bash|zsh|swift|kt|java|c|cpp|h|hpp|rb|php|xml|toml|ini|cfg|conf|env|sql|graphql|vue|svelte|astro|prisma))(?=[\s)\]}.,;:!?>]|$)/gi;

interface CodeRange {
  start: number;
  end: number;
}

function findCodeRanges(text: string): CodeRange[] {
  const ranges: CodeRange[] = [];
  const fencedRegex = /```[\s\S]*?```/g;
  let match;
  while ((match = fencedRegex.exec(text)) !== null) {
    ranges.push({ start: match.index, end: match.index + match[0].length });
  }
  const inlineRegex = /(?<!`)`(?!`)([^`\n]+)`(?!`)/g;
  while ((match = inlineRegex.exec(text)) !== null) {
    const pos = match.index;
    const insideOther = ranges.some((r) => pos >= r.start && pos < r.end);
    if (!insideOther) {
      ranges.push({ start: pos, end: pos + match[0].length });
    }
  }
  return ranges;
}

function isInsideCode(pos: number, ranges: CodeRange[]): boolean {
  return ranges.some((r) => pos >= r.start && pos < r.end);
}

function isAlreadyLinked(text: string, linkStart: number, linkEnd: number): boolean {
  const before = text.slice(Math.max(0, linkStart - 2), linkStart);
  if (before.endsWith("](")) return true;
  if (before.endsWith("][")) return true;
  const charBefore = text[linkStart - 1];
  const charAfter = text[linkEnd];
  if (charBefore === "[" && charAfter === "]") return true;
  return false;
}

export function preprocessLinks(text: string): string {
  const codeRanges = findCodeRanges(text);
  const links: { start: number; end: number; text: string; url: string }[] = [];

  let urlMatch;
  URL_REGEX.lastIndex = 0;
  while ((urlMatch = URL_REGEX.exec(text)) !== null) {
    links.push({
      start: urlMatch.index,
      end: urlMatch.index + urlMatch[0].length,
      text: urlMatch[0],
      url: urlMatch[0],
    });
  }

  FILE_PATH_REGEX.lastIndex = 0;
  let fileMatch;
  while ((fileMatch = FILE_PATH_REGEX.exec(text)) !== null) {
    const path = fileMatch[1];
    if (!path) continue;
    const fullMatch = fileMatch[0];
    const pathOffset = fullMatch.indexOf(path);
    const start = fileMatch.index + pathOffset;
    links.push({
      start,
      end: start + path.length,
      text: path,
      url: path,
    });
  }

  if (links.length === 0) return text;

  links.sort((a, b) => a.start - b.start);

  let result = "";
  let lastIndex = 0;

  for (const link of links) {
    if (isInsideCode(link.start, codeRanges)) continue;
    if (isAlreadyLinked(text, link.start, link.end)) continue;
    result += text.slice(lastIndex, link.start);
    result += `[${link.text}](${link.url})`;
    lastIndex = link.end;
  }

  result += text.slice(lastIndex);
  return result;
}

export function hasLinks(text: string): boolean {
  URL_REGEX.lastIndex = 0;
  if (URL_REGEX.test(text)) return true;
  FILE_PATH_REGEX.lastIndex = 0;
  return FILE_PATH_REGEX.test(text);
}
