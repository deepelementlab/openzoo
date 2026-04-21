package sanitize

import (
	"testing"
)

func TestHTML(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  string
	}{
		{"plain text", "hello world", "hello world"},
		{"safe markdown", "**bold** and *italic*", "**bold** and *italic*"},
		{"script tag stripped", `<script>alert(1)</script>`, ""},
		{"iframe stripped", `<iframe srcdoc="<script>parent.__xss=1</script>"></iframe>`, ""},
		{"img with onerror stripped", `<img src=x onerror="alert(1)">`, `<img src="x">`},
		{"safe link preserved", `<a href="https://example.com">link</a>`, `<a href="https://example.com" rel="nofollow">link</a>`},
		{"file card div preserved", `<div data-type="fileCard" data-href="https://cdn.example.com/file.pdf" data-filename="report.pdf"></div>`, `<div data-type="fileCard" data-href="https://cdn.example.com/file.pdf" data-filename="report.pdf"></div>`},
		{"object tag stripped", `<object data="evil.swf"></object>`, ""},
		{"embed tag stripped", `<embed src="evil.swf">`, ""},
		{"style tag stripped", `<style>body{display:none}</style>`, ""},
		{"mention link preserved", `[@User](mention://member/abc-123)`, `[@User](mention://member/abc-123)`},
		{"file card with javascript href stripped", `<div data-type="fileCard" data-href="javascript:alert(1)" data-filename="evil.pdf"></div>`, `<div data-type="fileCard" data-filename="evil.pdf"></div>`},
		{"file card with data URI stripped", `<div data-type="fileCard" data-href="data:text/html,<script>alert(1)</script>" data-filename="x.html"></div>`, `<div data-type="fileCard" data-filename="x.html"></div>`},
		{"file card with http href preserved", `<div data-type="fileCard" data-href="http://example.com/file.pdf" data-filename="file.pdf"></div>`, `<div data-type="fileCard" data-href="http://example.com/file.pdf" data-filename="file.pdf"></div>`},
		{"fenced code block preserves ampersands", "```\na && b\n```", "```\na && b\n```"},
		{"fenced code block preserves angle brackets", "```html\n<div class=\"x\">hello</div>\n```", "```html\n<div class=\"x\">hello</div>\n```"},
		{"inline code preserves ampersands", "run `a && b` in shell", "run `a && b` in shell"},
		{"inline code preserves angle brackets", "use `x < y && y > z`", "use `x < y && y > z`"},
		{"double backtick inline code preserved", "use ``a && b`` here", "use ``a && b`` here"},
		{"script in fenced code block preserved", "```\n<script>alert(1)</script>\n```", "```\n<script>alert(1)</script>\n```"},
		{"script outside code block still stripped", "hello <script>alert(1)</script> world", "hello  world"},
		{"mixed code and non-code", "text `a && b` more <script>x</script> end", "text `a && b` more  end"},
		{"tilde fenced code block preserves content", "~~~\na && b\n~~~", "~~~\na && b\n~~~"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := HTML(tt.input)
			if got != tt.want {
				t.Errorf("HTML(%q) = %q, want %q", tt.input, got, tt.want)
			}
		})
	}
}
