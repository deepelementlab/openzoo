package provider

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
)

type ProviderConfig struct {
	Provider    string `json:"provider"`
	APIKey      string `json:"api_key"`
	BaseURL     string `json:"base_url"`
	Model       string `json:"model"`
	Temperature float64 `json:"temperature"`
	MaxTokens   int     `json:"max_tokens"`
}

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type CompletionRequest struct {
	Messages    []Message `json:"messages"`
	Temperature float64   `json:"temperature"`
	MaxTokens   int       `json:"max_tokens"`
	Stream      bool      `json:"stream"`
}

type CompletionResponse struct {
	ID      string `json:"id"`
	Content string `json:"content"`
	Usage   *Usage `json:"usage,omitempty"`
}

type Usage struct {
	InputTokens  int `json:"input_tokens"`
	OutputTokens int `json:"output_tokens"`
}

type Provider interface {
	Name() string
	Complete(ctx context.Context, req CompletionRequest) (*CompletionResponse, error)
	StreamComplete(ctx context.Context, req CompletionRequest, callback func(chunk string) error) error
}

func NewProvider(config ProviderConfig) (Provider, error) {
	switch strings.ToLower(config.Provider) {
	case "openai", "claude", "codex", "opencode", "hermes":
		return &LLMProvider{config: config}, nil
	case "local":
		return &LocalProvider{config: config}, nil
	default:
		return nil, fmt.Errorf("unknown provider: %s", config.Provider)
	}
}

type LLMProvider struct {
	config ProviderConfig
}

func (p *LLMProvider) Name() string {
	return p.config.Provider
}

func (p *LLMProvider) Complete(ctx context.Context, req CompletionRequest) (*CompletionResponse, error) {
	if p.config.APIKey == "" {
		p.config.APIKey = os.Getenv("OPENAI_API_KEY")
	}
	if p.config.BaseURL == "" {
		p.config.BaseURL = "https://api.openai.com/v1/chat/completions"
	}

	payload := map[string]interface{}{
		"model":       p.config.Model,
		"messages":    req.Messages,
		"temperature": req.Temperature,
		"max_tokens":  req.MaxTokens,
		"stream":      false,
	}

	body, _ := json.Marshal(payload)
	httpReq, err := http.NewRequestWithContext(ctx, "POST", p.config.BaseURL, strings.NewReader(string(body)))
	if err != nil {
		return nil, err
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+p.config.APIKey)

	client := &http.Client{}
	resp, err := client.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API error %d: %s", resp.StatusCode, string(respBody))
	}

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	content := ""
	if choices, ok := result["choices"].([]interface{}); ok && len(choices) > 0 {
		if choice, ok := choices[0].(map[string]interface{}); ok {
			if message, ok := choice["message"].(map[string]interface{}); ok {
				content, _ = message["content"].(string)
			}
		}
	}

	usage := &Usage{}
	if u, ok := result["usage"].(map[string]interface{}); ok {
		if v, ok := u["prompt_tokens"].(float64); ok {
			usage.InputTokens = int(v)
		}
		if v, ok := u["completion_tokens"].(float64); ok {
			usage.OutputTokens = int(v)
		}
	}

	return &CompletionResponse{
		ID:      fmt.Sprintf("%v", result["id"]),
		Content: content,
		Usage:   usage,
	}, nil
}

func (p *LLMProvider) StreamComplete(ctx context.Context, req CompletionRequest, callback func(chunk string) error) error {
	payload := map[string]interface{}{
		"model":       p.config.Model,
		"messages":    req.Messages,
		"temperature": req.Temperature,
		"max_tokens":  req.MaxTokens,
		"stream":      true,
	}

	body, _ := json.Marshal(payload)
	httpReq, err := http.NewRequestWithContext(ctx, "POST", p.config.BaseURL, strings.NewReader(string(body)))
	if err != nil {
		return err
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+p.config.APIKey)
	httpReq.Header.Set("Accept", "text/event-stream")

	client := &http.Client{}
	resp, err := client.Do(httpReq)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("API error %d", resp.StatusCode)
	}

	buf := make([]byte, 4096)
	for {
		n, err := resp.Body.Read(buf)
		if n > 0 {
			lines := strings.Split(string(buf[:n]), "\n")
			for _, line := range lines {
				if strings.HasPrefix(line, "data: ") {
					data := strings.TrimPrefix(line, "data: ")
					if data == "[DONE]" {
						return nil
					}
					var parsed map[string]interface{}
					if json.Unmarshal([]byte(data), &parsed) == nil {
						if choices, ok := parsed["choices"].([]interface{}); ok && len(choices) > 0 {
							if choice, ok := choices[0].(map[string]interface{}); ok {
								if delta, ok := choice["delta"].(map[string]interface{}); ok {
									if content, ok := delta["content"].(string); ok && content != "" {
										if err := callback(content); err != nil {
											return err
										}
									}
								}
							}
						}
					}
				}
			}
		}
		if err != nil {
			if err == io.EOF {
				return nil
			}
			return err
		}
	}
}

type LocalProvider struct {
	config ProviderConfig
}

func (p *LocalProvider) Name() string {
	return "local"
}

func (p *LocalProvider) Complete(ctx context.Context, req CompletionRequest) (*CompletionResponse, error) {
	return &CompletionResponse{
		ID:      "local",
		Content: "Local provider - not implemented",
		Usage:   &Usage{},
	}, nil
}

func (p *LocalProvider) StreamComplete(ctx context.Context, req CompletionRequest, callback func(chunk string) error) error {
	return callback("Local provider - not implemented")
}
