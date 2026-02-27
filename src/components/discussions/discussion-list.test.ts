import { describe, it, expect } from "vitest";
import { stripMarkdown } from "./discussion-list";

describe("stripMarkdown", () => {
  it("strips headings", () => {
    expect(stripMarkdown("# Heading 1")).toBe("Heading 1");
    expect(stripMarkdown("## Heading 2")).toBe("Heading 2");
    expect(stripMarkdown("### Heading 3")).toBe("Heading 3");
    expect(stripMarkdown("###### Heading 6")).toBe("Heading 6");
  });

  it("strips bold markers", () => {
    expect(stripMarkdown("**bold text**")).toBe("bold text");
    expect(stripMarkdown("__bold text__")).toBe("bold text");
  });

  it("strips italic markers", () => {
    expect(stripMarkdown("*italic text*")).toBe("italic text");
    expect(stripMarkdown("_italic text_")).toBe("italic text");
  });

  it("strips bold+italic markers", () => {
    expect(stripMarkdown("***bold italic***")).toBe("bold italic");
    expect(stripMarkdown("___bold italic___")).toBe("bold italic");
  });

  it("strips strikethrough", () => {
    expect(stripMarkdown("~~deleted~~")).toBe("deleted");
  });

  it("converts links to text", () => {
    expect(stripMarkdown("[click here](https://example.com)")).toBe(
      "click here"
    );
  });

  it("removes images", () => {
    expect(stripMarkdown("![alt text](image.png)")).toBe("");
  });

  it("strips inline code", () => {
    expect(stripMarkdown("use `const x = 1` here")).toBe(
      "use const x = 1 here"
    );
  });

  it("strips fenced code blocks", () => {
    const md = "before\n```js\nconst x = 1;\n```\nafter";
    expect(stripMarkdown(md)).toBe("before after");
  });

  it("strips blockquotes", () => {
    expect(stripMarkdown("> quoted text")).toBe("quoted text");
  });

  it("strips horizontal rules", () => {
    expect(stripMarkdown("above\n---\nbelow")).toBe("above below");
    expect(stripMarkdown("above\n***\nbelow")).toBe("above below");
    expect(stripMarkdown("above\n___\nbelow")).toBe("above below");
  });

  it("strips unordered list markers", () => {
    const md = "- item 1\n- item 2\n* item 3";
    expect(stripMarkdown(md)).toBe("item 1 item 2 item 3");
  });

  it("strips ordered list markers", () => {
    const md = "1. first\n2. second\n3. third";
    expect(stripMarkdown(md)).toBe("first second third");
  });

  it("collapses multiple newlines into single space", () => {
    expect(stripMarkdown("line one\n\n\nline two")).toBe("line one line two");
  });

  it("collapses multiple spaces", () => {
    expect(stripMarkdown("word   one    two")).toBe("word one two");
  });

  it("trims leading and trailing whitespace", () => {
    expect(stripMarkdown("  hello world  ")).toBe("hello world");
  });

  it("handles empty string", () => {
    expect(stripMarkdown("")).toBe("");
  });

  it("handles complex markdown document", () => {
    const md = [
      "# Title",
      "",
      "Some **bold** and *italic* text with a [link](https://example.com).",
      "",
      "```python",
      "print('hello')",
      "```",
      "",
      "> A quote",
      "",
      "- List item",
    ].join("\n");

    const result = stripMarkdown(md);
    expect(result).toContain("Title");
    expect(result).toContain("bold");
    expect(result).toContain("italic");
    expect(result).toContain("link");
    expect(result).toContain("A quote");
    expect(result).toContain("List item");
    expect(result).not.toContain("```");
    expect(result).not.toContain("**");
    expect(result).not.toContain("[");
    expect(result).not.toContain("print");
  });
});
