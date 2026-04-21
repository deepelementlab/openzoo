package main

import (
	"encoding/json"
	"fmt"
	"io"
	"strings"
	"text/tabwriter"
)

func printTable(w io.Writer, headers []string, rows [][]string) {
	tw := tabwriter.NewWriter(w, 0, 0, 2, ' ', 0)
	fmt.Fprint(tw, strings.Join(headers, "\t"))
	fmt.Fprint(tw, "\n")
	for _, row := range rows {
		fmt.Fprint(tw, strings.Join(row, "\t"))
		fmt.Fprint(tw, "\n")
	}
	tw.Flush()
}

func printJSON(w io.Writer, v any) error {
	enc := json.NewEncoder(w)
	enc.SetIndent("", "  ")
	return enc.Encode(v)
}
