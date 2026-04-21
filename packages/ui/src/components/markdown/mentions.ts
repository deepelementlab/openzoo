export function preprocessMentionShortcodes(text: string): string {
  if (!text.includes("[@ ")) return text;
  return text.replace(
    /\[@\s+([^\]]*)\]/g,
    (match, attrString: string) => {
      const attrs: Record<string, string> = {};
      const re = /(\w+)="([^"]*)"/g;
      let m;
      while ((m = re.exec(attrString)) !== null) {
        if (m[1] && m[2] !== undefined) attrs[m[1]] = m[2];
      }
      const { id, label } = attrs;
      if (!id || !label) return match;
      return `[@${label}](mention://member/${id})`;
    },
  );
}
