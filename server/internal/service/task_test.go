package service

import (
	"encoding/json"
	"testing"
)

func TestTaskUsage_MarshalJSON(t *testing.T) {
	usage := TaskUsage{
		Provider:         "claude",
		Model:            "sonnet",
		InputTokens:      100,
		OutputTokens:     200,
		CacheReadTokens:  50,
		CacheWriteTokens: 25,
	}
	data, err := json.Marshal(map[string]interface{}{"usage": usage})
	if err != nil {
		t.Fatalf("failed to marshal: %v", err)
	}
	var m map[string]interface{}
	if err := json.Unmarshal(data, &m); err != nil {
		t.Fatalf("failed to unmarshal: %v", err)
	}
	u := m["usage"].(map[string]interface{})
	if u["provider"] != "claude" {
		t.Errorf("expected provider=claude, got %v", u["provider"])
	}
	if u["input_tokens"] != float64(100) {
		t.Errorf("expected input_tokens=100, got %v", u["input_tokens"])
	}
	if u["cache_read_tokens"] != float64(50) {
		t.Errorf("expected cache_read_tokens=50, got %v", u["cache_read_tokens"])
	}
	if u["cache_write_tokens"] != float64(25) {
		t.Errorf("expected cache_write_tokens=25, got %v", u["cache_write_tokens"])
	}
}

func TestTaskUsage_ZeroValues(t *testing.T) {
	usage := TaskUsage{}
	data, err := json.Marshal(map[string]interface{}{"usage": usage})
	if err != nil {
		t.Fatalf("failed to marshal: %v", err)
	}
	var m map[string]interface{}
	if err := json.Unmarshal(data, &m); err != nil {
		t.Fatalf("failed to unmarshal: %v", err)
	}
	u := m["usage"].(map[string]interface{})
	if u["input_tokens"] != float64(0) {
		t.Errorf("expected input_tokens=0, got %v", u["input_tokens"])
	}
}

func TestInboundMessage_Types(t *testing.T) {
	msg := InboundMessage{
		Seq:     1,
		Type:    "text",
		Content: "hello world",
	}
	data, err := json.Marshal(msg)
	if err != nil {
		t.Fatalf("failed to marshal: %v", err)
	}
	var m map[string]interface{}
	if err := json.Unmarshal(data, &m); err != nil {
		t.Fatalf("failed to unmarshal: %v", err)
	}
	if m["seq"] != float64(1) {
		t.Errorf("expected seq=1, got %v", m["seq"])
	}
	if m["type"] != "text" {
		t.Errorf("expected type=text, got %v", m["type"])
	}
}

func TestInboundMessage_ToolUse(t *testing.T) {
	msg := InboundMessage{
		Seq:    2,
		Type:   "tool_use",
		Tool:   "read_file",
		CallID: "call-123",
		Input:  `{"path":"/tmp/test"}`,
	}
	data, err := json.Marshal(msg)
	if err != nil {
		t.Fatalf("failed to marshal: %v", err)
	}
	var m map[string]interface{}
	if err := json.Unmarshal(data, &m); err != nil {
		t.Fatalf("failed to unmarshal: %v", err)
	}
	if m["tool"] != "read_file" {
		t.Errorf("expected tool=read_file, got %v", m["tool"])
	}
	if m["call_id"] != "call-123" {
		t.Errorf("expected call_id=call-123, got %v", m["call_id"])
	}
}

func TestTaskMessageData_NilSlice(t *testing.T) {
	var messages []InboundMessage
	data, err := json.Marshal(messages)
	if err != nil {
		t.Fatalf("failed to marshal nil slice: %v", err)
	}
	if string(data) != "null" {
		t.Logf("nil slice marshals to: %s (this is expected Go behavior)", data)
	}
	msgs := make([]InboundMessage, 0)
	data2, _ := json.Marshal(msgs)
	if string(data2) != "[]" {
		t.Errorf("empty slice should marshal to [], got: %s", data2)
	}
}
