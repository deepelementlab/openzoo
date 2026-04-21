package sanitize

import (
	"fmt"
	"regexp"
	"strings"

	"github.com/microcosm-cc/bluemonday"
)

var httpURL = regexp.MustCompile(`^https?://`)

var policy *bluemonday.Policy

func init() {
	policy = bluemonday.UGCPolicy()
	policy.AllowElements("div", "span")
	policy.AllowAttrs("data-type", "data-filename").OnElements("div")
	policy.AllowAttrs("data-href").Matching(httpURL).OnElements("div")
	policy.AllowAttrs("class").OnElements("code", "div", "span", "pre")
}

var fencedCodeBlock = regexp.MustCompile("(?m)^(```|~~~)[^\n]*\n[\\s\\S]*?\n(```|~~~)[ \t]*$")

var inlineCode = regexp.MustCompile("```[^`]+```|``[^`]+``|`[^`]+`")

func HTML(input string) string {
	var blocks []string
	placeholder := func(i int) string { return fmt.Sprintf("\x00CODEBLOCK_%d\x00", i) }
	result := fencedCodeBlock.ReplaceAllStringFunc(input, func(m string) string {
		idx := len(blocks)
		blocks = append(blocks, m)
		return placeholder(idx)
	})

	var inlines []string
	inlinePH := func(i int) string { return fmt.Sprintf("\x00INLINE_%d\x00", i) }
	result = inlineCode.ReplaceAllStringFunc(result, func(m string) string {
		idx := len(inlines)
		inlines = append(inlines, m)
		return inlinePH(idx)
	})

	result = policy.Sanitize(result)

	for i, code := range inlines {
		result = strings.Replace(result, inlinePH(i), code, 1)
	}
	for i, block := range blocks {
		result = strings.Replace(result, placeholder(i), block, 1)
	}

	return result
}
