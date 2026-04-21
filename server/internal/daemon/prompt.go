package daemon

import "fmt"

func (d *Daemon) buildPrompt(task *Task) string {
	if task.ChatMessage != "" {
		return buildChatPrompt(task)
	}
	if task.TriggerCommentContent != "" {
		return buildCommentPrompt(task)
	}
	return buildDefaultPrompt(task)
}

func buildCommentPrompt(task *Task) string {
	return fmt.Sprintf(`A comment was posted on an issue that triggered this task.

**Issue**: %s
**Trigger Comment**:

%s

Please address this comment by taking the appropriate action on the issue.`, task.IssueID, task.TriggerCommentContent)
}

func buildChatPrompt(task *Task) string {
	return task.ChatMessage
}

func buildDefaultPrompt(task *Task) string {
	return fmt.Sprintf(`You are assigned to execute a task on issue %s in workspace %s.

First, read the issue details using: openzoo issue get %s --output json
Then complete the task described in the issue.`, task.IssueID, task.WorkspaceID, task.IssueID)
}
