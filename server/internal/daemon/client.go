package daemon

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

type requestError struct {
	Method     string
	Path       string
	StatusCode int
	Body       string
}

func (e *requestError) Error() string {
	return fmt.Sprintf("%s %s returned %d: %s", e.Method, e.Path, e.StatusCode, e.Body)
}

func isWorkspaceNotFoundError(err error) bool {
	var reqErr *requestError
	if !errors.As(err, &reqErr) {
		return false
	}
	if reqErr.StatusCode != http.StatusNotFound {
		return false
	}
	return strings.Contains(strings.ToLower(reqErr.Body), "workspace not found")
}

type Client struct {
	baseURL string
	token   string
	client  *http.Client
}

func NewClient(baseURL string) *Client {
	return &Client{
		baseURL: baseURL,
		client:  &http.Client{Timeout: 30 * time.Second},
	}
}

func (c *Client) SetToken(token string) {
	c.token = token
}

func (c *Client) Token() string {
	return c.token
}

func (c *Client) ClaimTask(ctx context.Context, runtimeID string) (*Task, error) {
	var resp struct {
		Task *Task `json:"task"`
	}
	if err := c.postJSON(ctx, "/rpc/daemon/claim-task", map[string]string{"runtime_id": runtimeID}, &resp); err != nil {
		return nil, err
	}
	return resp.Task, nil
}

func (c *Client) StartTask(ctx context.Context, taskID string) error {
	return c.postJSON(ctx, "/rpc/daemon/start-task", map[string]string{"task_id": taskID}, nil)
}

func (c *Client) CompleteTask(ctx context.Context, taskID string, result TaskResult) error {
	return c.postJSON(ctx, "/rpc/daemon/complete-task", map[string]any{
		"task_id": taskID,
		"result":  result,
	}, nil)
}

func (c *Client) FailTask(ctx context.Context, taskID, errMsg string) error {
	return c.postJSON(ctx, "/rpc/daemon/fail-task", map[string]string{
		"task_id": taskID,
		"error":   errMsg,
	}, nil)
}

func (c *Client) ReportMessages(ctx context.Context, taskID string, messages []TaskMessageData) error {
	return c.postJSON(ctx, "/rpc/daemon/report-messages", map[string]any{
		"task_id":  taskID,
		"messages": messages,
	}, nil)
}

func (c *Client) ReportTaskUsage(ctx context.Context, taskID string, usage []TaskUsageEntry) error {
	if len(usage) == 0 {
		return nil
	}
	return c.postJSON(ctx, fmt.Sprintf("/rpc/daemon/tasks/%s/usage", taskID), map[string]any{
		"usage": usage,
	}, nil)
}

func (c *Client) ReportProgress(ctx context.Context, taskID, summary string, step, total int) error {
	return c.postJSON(ctx, fmt.Sprintf("/rpc/daemon/tasks/%s/progress", taskID), map[string]any{
		"summary": summary,
		"step":    step,
		"total":   total,
	}, nil)
}

func (c *Client) GetTaskStatus(ctx context.Context, taskID string) (string, error) {
	var resp struct {
		Status string `json:"status"`
	}
	if err := c.postJSON(ctx, "/rpc/task/get", map[string]string{"task_id": taskID}, &resp); err != nil {
		return "", err
	}
	return resp.Status, nil
}

func (c *Client) SendHeartbeat(ctx context.Context, runtimeID string) (*HeartbeatResponse, error) {
	var resp HeartbeatResponse
	if err := c.postJSON(ctx, "/rpc/daemon/heartbeat", map[string]string{
		"daemon_id": runtimeID,
	}, &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

func (c *Client) ReportPingResult(ctx context.Context, runtimeID, pingID string, result map[string]any) error {
	return c.postJSON(ctx, fmt.Sprintf("/rpc/daemon/runtimes/%s/ping/%s/result", runtimeID, pingID), result, nil)
}

func (c *Client) ReportUpdateResult(ctx context.Context, runtimeID, updateID string, result map[string]any) error {
	return c.postJSON(ctx, fmt.Sprintf("/rpc/daemon/runtimes/%s/update/%s/result", runtimeID, updateID), result, nil)
}

func (c *Client) ReportUsage(ctx context.Context, runtimeID string, entries []map[string]any) error {
	return c.postJSON(ctx, fmt.Sprintf("/rpc/daemon/runtimes/%s/usage", runtimeID), map[string]any{
		"entries": entries,
	}, nil)
}

func (c *Client) ListWorkspaces(ctx context.Context) ([]WorkspaceInfo, error) {
	var workspaces []WorkspaceInfo
	if err := c.getJSON(ctx, "/rpc/workspace/list", &workspaces); err != nil {
		return nil, err
	}
	return workspaces, nil
}

func (c *Client) RegisterRuntime(ctx context.Context, workspaceID, name, provider string) (string, error) {
	var resp struct {
		ID string `json:"id"`
	}
	if err := c.postJSON(ctx, "/rpc/daemon/register", map[string]string{
		"workspace_id": workspaceID,
		"name":         name,
		"provider":     provider,
	}, &resp); err != nil {
		return "", err
	}
	return resp.ID, nil
}

func (c *Client) Deregister(ctx context.Context, runtimeIDs []string) error {
	return c.postJSON(ctx, "/rpc/daemon/deregister", map[string]any{
		"runtime_ids": runtimeIDs,
	}, nil)
}

func (c *Client) postJSON(ctx context.Context, path string, reqBody any, respBody any) error {
	var body io.Reader
	if reqBody != nil {
		data, err := json.Marshal(reqBody)
		if err != nil {
			return err
		}
		body = bytes.NewReader(data)
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+path, body)
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	if c.token != "" {
		req.Header.Set("Authorization", "Bearer "+c.token)
	}
	resp, err := c.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		data, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
		return &requestError{Method: http.MethodPost, Path: path, StatusCode: resp.StatusCode, Body: strings.TrimSpace(string(data))}
	}
	if respBody == nil {
		io.Copy(io.Discard, resp.Body)
		return nil
	}
	return json.NewDecoder(resp.Body).Decode(respBody)
}

func (c *Client) getJSON(ctx context.Context, path string, respBody any) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.baseURL+path, nil)
	if err != nil {
		return err
	}
	if c.token != "" {
		req.Header.Set("Authorization", "Bearer "+c.token)
	}
	resp, err := c.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		data, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
		return &requestError{Method: http.MethodGet, Path: path, StatusCode: resp.StatusCode, Body: strings.TrimSpace(string(data))}
	}
	if respBody == nil {
		io.Copy(io.Discard, resp.Body)
		return nil
	}
	return json.NewDecoder(resp.Body).Decode(respBody)
}
