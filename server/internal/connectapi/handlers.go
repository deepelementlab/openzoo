package connectapi

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/openzoo-ai/openzoo/server/internal/events"
	"github.com/openzoo-ai/openzoo/server/internal/middleware"
	"github.com/openzoo-ai/openzoo/server/internal/service"
)

type Handler struct {
	workspace       *service.WorkspaceService
	issue           *service.IssueService
	agent           *service.AgentService
	chat            *service.ChatService
	inbox           *service.InboxService
	task            *service.TaskService
	project         *service.ProjectService
	runtime         *service.RuntimeService
	pat             *service.PATService
	file            *service.FileService
	label           *service.LabelService
	cycle           *service.CycleService
	view            *service.ViewService
	daemon          *service.DaemonService
	externalSession *service.ExternalSessionService
	authStore       *service.AuthStore
	publisher       *events.Publisher
	db              *pgxpool.Pool
}

func NewHandler(db *pgxpool.Pool) *Handler {
	return &Handler{
		workspace: service.NewWorkspaceService(db),
		issue:     service.NewIssueService(db),
		agent:     service.NewAgentService(db),
		chat:      service.NewChatService(db),
		inbox:     service.NewInboxService(db),
		task:      service.NewTaskService(db),
		project:   service.NewProjectService(db),
		runtime:   service.NewRuntimeService(db),
		pat:       service.NewPATService(db),
		file:      service.NewFileService(db, "/tmp/openzoo/uploads", "/api/files"),
		label:     service.NewLabelService(db),
		cycle:     service.NewCycleService(db),
		view:      service.NewViewService(db),
		daemon:          service.NewDaemonService(db),
		externalSession: service.NewExternalSessionService(db),
		authStore:       service.NewAuthStore(db),
		publisher: events.GetPublisher(),
		db:        db,
	}
}

func RegisterConnectRPC(r chi.Router, db *pgxpool.Pool) {
	h := NewHandler(db)
	r.Route("/rpc", func(r chi.Router) {
		r.Get("/health", h.healthCheck)

		r.Post("/auth/send-code", h.sendVerificationCode)
		r.Post("/auth/verify-code", h.verifyCode)
		r.Post("/auth/login", h.loginWithToken)

		// Protected endpoints.
		r.Group(func(r chi.Router) {
			r.Use(middleware.RequireAuth)

			r.Post("/workspace/list", h.listWorkspaces)
			r.Post("/workspace/get", h.getWorkspace)
			r.Post("/workspace/create", h.createWorkspace)
			r.Post("/workspace/update", h.updateWorkspace)
			r.Post("/workspace/delete", h.deleteWorkspace)
			r.Post("/workspace/repos", h.listRepos)
			r.Post("/workspace/add-repo", h.addRepo)
			r.Post("/workspace/remove-repo", h.removeRepo)
			r.Post("/workspace/sync-repo", h.syncRepo)
			r.Post("/auth/me", h.getCurrentUser)
			r.Post("/auth/update-me", h.updateCurrentUser)
			r.Post("/member/list", h.listMembers)
			r.Post("/member/create", h.createMember)
			r.Post("/member/update", h.updateMember)
			r.Post("/member/delete", h.deleteMember)
			r.Post("/issue/list", h.listIssues)
			r.Post("/issue/get", h.getIssue)
			r.Post("/issue/create", h.createIssue)
			r.Post("/issue/update", h.updateIssue)
			r.Post("/issue/delete", h.deleteIssue)
			r.Post("/issue/search", h.searchIssues)
			r.Post("/issue/batch-update", h.batchUpdateIssues)
			r.Post("/search/projects", h.searchProjects)
			r.Post("/agent/list", h.listAgents)
			r.Post("/agent/get", h.getAgent)
			r.Post("/agent/create", h.createAgent)
			r.Post("/agent/update", h.updateAgent)
			r.Post("/agent/archive", h.archiveAgent)
			r.Post("/agent/restore", h.restoreAgent)
			r.Post("/runtime/list", h.listRuntimes)
			r.Post("/runtime/register", h.registerRuntime)
			r.Post("/task/create", h.createTask)
			r.Post("/task/get", h.getTask)
			r.Post("/task/list", h.listTasks)
			r.Post("/task/update-status", h.updateTaskStatus)
			r.Post("/task/cancel", h.cancelTask)
			r.Post("/task/messages", h.listTaskMessages)
			r.Post("/chat/sessions", h.listChatSessions)
			r.Post("/chat/create-session", h.createChatSession)
			r.Post("/chat/messages", h.listChatMessages)
			r.Post("/chat/send", h.sendChatMessage)
			r.Post("/inbox/list", h.listInbox)
			r.Post("/inbox/mark-read", h.markInboxRead)
			r.Post("/inbox/mark-archived", h.markInboxArchived)
			r.Post("/inbox/mark-all-read", h.markAllInboxRead)
			r.Post("/project/list", h.listProjects)
			r.Post("/project/create", h.createProject)
			r.Post("/project/update", h.updateProject)
			r.Post("/project/delete", h.deleteProject)
			r.Post("/pin/list", h.listPins)
			r.Post("/pin/create", h.createPin)
			r.Post("/pin/delete", h.deletePin)
			r.Post("/pin/reorder", h.reorderPins)
			r.Post("/comment/list", h.listComments)
			r.Post("/comment/create", h.createComment)
			r.Post("/comment/update", h.updateComment)
			r.Post("/comment/delete", h.deleteComment)
			r.Post("/comment/add-reaction", h.addCommentReaction)
			r.Post("/comment/remove-reaction", h.removeCommentReaction)
			r.Post("/comment/timeline", h.listCommentTimeline)
			r.Post("/comment/upload", h.uploadAttachment)
			r.Post("/comment/delete-attachment", h.deleteAttachment)
			r.Post("/pat/list", h.listPATs)
			r.Post("/pat/create", h.createPAT)
			r.Post("/pat/delete", h.deletePAT)
			r.Post("/issue/subscribers", h.listIssueSubscribers)
			r.Post("/issue/subscribe", h.subscribeIssue)
			r.Post("/issue/unsubscribe", h.unsubscribeIssue)
			r.Post("/issue/reactions", h.listIssueReactions)
			r.Post("/issue/add-reaction", h.addIssueReaction)
			r.Post("/issue/remove-reaction", h.removeIssueReaction)
			r.Post("/activity/list", h.listActivities)
			r.Post("/activity/create", h.createActivity)
			r.Post("/file/upload", h.uploadFile)
			r.Post("/file/list", h.listFiles)
			r.Post("/file/delete", h.deleteFile)
			r.Get("/file/download/:id", h.downloadFile)
			r.Post("/skill/list", h.listSkills)
			r.Post("/skill/create", h.createSkill)
			r.Post("/skill/update", h.updateSkill)
			r.Post("/skill/delete", h.deleteSkill)
			r.Post("/agent/set-skills", h.setAgentSkills)
			r.Post("/agent/list-skills", h.listAgentSkills)
			r.Post("/runtime/get", h.getRuntimeDetail)
			r.Post("/runtime/update", h.updateRuntime)
			r.Post("/runtime/delete", h.deleteRuntime)
			r.Post("/daemon/embedded/start", h.startEmbeddedDaemon)
			r.Post("/daemon/embedded/stop", h.stopEmbeddedDaemon)
			r.Post("/daemon/embedded/status", h.getEmbeddedDaemonStatus)
			r.Post("/daemon/register", h.registerDaemon)
			r.Post("/daemon/unregister", h.unregisterDaemon)
			r.Post("/daemon/list", h.listDaemons)
			r.Post("/daemon/get", h.getDaemonDetail)
			r.Post("/daemon/external/discover", h.discoverExternalSessions)
			r.Post("/daemon/external/list", h.listExternalSessions)
			r.Post("/daemon/external/monitor", h.monitorExternalSession)
			r.Post("/daemon/external/adopt", h.adoptExternalSession)
			r.Post("/daemon/external/release", h.releaseExternalSession)
			r.Post("/daemon/external/stream", h.streamExternalSession)
			r.Group(func(r chi.Router) {
				r.Use(middleware.DaemonAuth(h.authStore))
				r.Post("/daemon/heartbeat", h.daemonHeartbeat)
				r.Post("/daemon/stats", h.daemonStats)
				r.Post("/daemon/claim-task", h.claimTask)
				r.Post("/daemon/start-task", h.startTask)
				r.Post("/daemon/complete-task", h.completeTask)
				r.Post("/daemon/fail-task", h.failTask)
				r.Post("/daemon/report-messages", h.reportMessages)
			})
			r.Post("/label/list", h.listLabels)
			r.Post("/label/create", h.createLabel)
			r.Post("/label/update", h.updateLabel)
			r.Post("/label/delete", h.deleteLabel)
			r.Post("/label/add-to-issue", h.addIssueLabel)
			r.Post("/label/remove-from-issue", h.removeIssueLabel)
			r.Post("/label/issue-labels", h.getIssueLabels)
			r.Post("/cycle/list", h.listCycles)
			r.Post("/cycle/get", h.getCycle)
			r.Post("/cycle/create", h.createCycle)
			r.Post("/cycle/update", h.updateCycle)
			r.Post("/cycle/delete", h.deleteCycle)
			r.Post("/cycle/add-issue", h.addIssueToCycle)
			r.Post("/cycle/remove-issue", h.removeIssueFromCycle)
			r.Post("/cycle/issues", h.getCycleIssues)
			r.Post("/view/list", h.listViews)
			r.Post("/view/get", h.getView)
			r.Post("/view/create", h.createView)
			r.Post("/view/update", h.updateView)
			r.Post("/view/delete", h.deleteView)
		})
	})
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func readJSON(r *http.Request) map[string]interface{} {
	var m map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&m); err != nil && r.ContentLength > 0 {
		log.Printf("[readJSON] failed to decode request body: %v", err)
	}
	if m == nil {
		m = make(map[string]interface{})
	}
	return m
}

func getStr(m map[string]interface{}, key string) string {
	v, _ := m[key].(string)
	return v
}

func getInt(m map[string]interface{}, key string) int {
	v, _ := m[key].(float64)
	return int(v)
}

func getBool(m map[string]interface{}, key string) bool {
	v, _ := m[key].(bool)
	return v
}
