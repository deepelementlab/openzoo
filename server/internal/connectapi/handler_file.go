package connectapi

import (
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/go-chi/chi/v5"
)

const maxUploadSize = 100 << 20

var dangerousExtensions = map[string]bool{
	".svg": true, ".css": true, ".js": true, ".html": true, ".htm": true,
}

var dangerousMIMETypes = map[string]string{
	".svg":  "image/svg+xml",
	".css":  "text/css",
	".js":   "application/javascript",
	".html": "text/html",
	".htm":  "text/html",
}

func (h *Handler) uploadFile(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, maxUploadSize+1024)
	if err := r.ParseMultipartForm(maxUploadSize); err != nil {
		writeJSON(w, 400, map[string]string{"error": "file too large (max 100MB)"})
		return
	}

	ws := r.FormValue("workspace_id")
	issueID := r.FormValue("issue_id")
	commentID := r.FormValue("comment_id")
	uploaderID := r.FormValue("uploader_id")

	if ws == "" {
		writeJSON(w, 400, map[string]string{"error": "workspace_id required"})
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		writeJSON(w, 400, map[string]string{"error": "file required"})
		return
	}
	defer file.Close()

	if header.Size > maxUploadSize {
		writeJSON(w, 400, map[string]string{"error": "file too large (max 100MB)"})
		return
	}

	filename := sanitizeFilename(header.Filename)
	if filename == "" {
		writeJSON(w, 400, map[string]string{"error": "invalid filename"})
		return
	}

	buf := make([]byte, 512)
	n, _ := file.Read(buf)
	detectedType := http.DetectContentType(buf[:n])

	contentType := detectedType
	if ext := strings.ToLower(filepath.Ext(filename)); ext != "" {
		if override, ok := dangerousMIMETypes[ext]; ok {
			contentType = override
		}
	}

	if _, err := file.Seek(0, io.SeekStart); err != nil {
		writeJSON(w, 500, map[string]string{"error": "failed to process file"})
		return
	}

	record, err := h.file.Upload(r.Context(), ws, issueID, commentID, uploaderID, filename, contentType, header.Size, file)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, 201, record)
}

func (h *Handler) listFiles(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	files, err := h.file.ListByIssue(r.Context(), getStr(in, "workspace_id"), getStr(in, "issue_id"))
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, 200, map[string]interface{}{"files": files})
}

func (h *Handler) deleteFile(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	ws := getStr(in, "workspace_id")
	fileID := getStr(in, "file_id")

	if ws == "" || fileID == "" {
		writeJSON(w, 400, map[string]string{"error": "workspace_id and file_id required"})
		return
	}

	record, err := h.file.Get(r.Context(), ws, fileID)
	if err != nil {
		writeJSON(w, 404, map[string]string{"error": "file not found"})
		return
	}

	userID := getStr(in, "user_id")
	if record.UploaderID != userID {
		writeJSON(w, 403, map[string]string{"error": "only the uploader or workspace admin can delete this file"})
		return
	}

	if err := h.file.Delete(r.Context(), ws, fileID); err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, 200, map[string]string{"status": "ok"})
}

func (h *Handler) downloadFile(w http.ResponseWriter, r *http.Request) {
	fileID := chi.URLParam(r, "id")
	ws := r.URL.Query().Get("workspace_id")

	record, err := h.file.Get(r.Context(), ws, fileID)
	if err != nil {
		writeJSON(w, 404, map[string]string{"error": "file not found"})
		return
	}

	filePath := h.file.GetFilePath(record.StoragePath)
	f, err := h.file.OpenFile(filePath)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": "failed to open file"})
		return
	}
	defer f.Close()

	disposition := "attachment"
	if strings.HasPrefix(record.ContentType, "image/") || strings.HasPrefix(record.ContentType, "video/") || strings.HasPrefix(record.ContentType, "audio/") || record.ContentType == "application/pdf" {
		disposition = "inline"
	}
	w.Header().Set("Content-Disposition", fmt.Sprintf(`%s; filename="%s"`, disposition, sanitizeFilename(record.Filename)))
	w.Header().Set("Content-Type", record.ContentType)
	w.Header().Set("Cache-Control", "max-age=432000,public")
	io.Copy(w, f)
}

func sanitizeFilename(name string) string {
	name = strings.ReplaceAll(name, "..", "")
	name = strings.ReplaceAll(name, "/", "")
	name = strings.ReplaceAll(name, "\\", "")
	name = strings.ReplaceAll(name, "\x00", "")
	name = strings.TrimSpace(name)
	if len(name) > 255 {
		ext := filepath.Ext(name)
		name = name[:255-len(ext)] + ext
	}
	return name
}
