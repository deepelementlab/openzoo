package service

import "fmt"

var allowedIssueFields = map[string]bool{
	"title": true, "description": true, "status": true, "priority": true,
	"assignee_type": true, "assignee_id": true, "parent_issue_id": true,
	"project_id": true, "position": true, "due_date": true, "updated_at": true,
}

var allowedAgentFields = map[string]bool{
	"name": true, "description": true, "instructions": true, "avatar_url": true,
	"visibility": true, "status": true, "max_concurrent_tasks": true,
	"runtime_id": true, "runtime_mode": true, "runtime_config": true, "updated_at": true,
}

var allowedSkillFields = map[string]bool{
	"name": true, "description": true, "content": true, "updated_at": true,
}

var allowedProjectFields = map[string]bool{
	"name": true, "description": true, "status": true, "priority": true,
	"icon": true, "color": true, "start_date": true, "target_date": true,
	"updated_at": true,
}

var allowedRuntimeFields = map[string]bool{
	"name": true, "status": true, "device_info": true, "updated_at": true,
}

func buildSetClauses(fields map[string]interface{}, allowed map[string]bool, startArg int) (string, []interface{}, int) {
	setClauses := ""
	args := []interface{}{}
	i := startArg
	for k, v := range fields {
		if !allowed[k] {
			continue
		}
		if setClauses != "" {
			setClauses += ", "
		}
		setClauses += fmt.Sprintf("%s = $%d", k, i)
		args = append(args, v)
		i++
	}
	return setClauses, args, i
}
