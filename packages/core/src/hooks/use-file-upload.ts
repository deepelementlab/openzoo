import { useState, useCallback } from "react";
import { getApiClient } from "../api/connect-client";
import type { Attachment } from "../types";
import { MAX_FILE_SIZE } from "../constants/upload";

export interface UploadResult {
  id: string;
  filename: string;
  download_url: string;
}

export interface UploadContext {
  issueId?: string;
  commentId?: string;
}

export function useFileUpload(onError?: (error: Error) => void) {
  const [uploading, setUploading] = useState(false);

  const upload = useCallback(
    async (file: File, ctx?: UploadContext): Promise<UploadResult | null> => {
      if (file.size > MAX_FILE_SIZE) {
        throw new Error("File exceeds 100 MB limit");
      }

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("workspace_id", getApiClient()["config"]?.getWorkspaceId?.() ?? "");
        if (ctx?.issueId) formData.append("issue_id", ctx.issueId);
        if (ctx?.commentId) formData.append("comment_id", ctx.commentId);

        const baseUrl = getApiClient().baseUrl;
        const token = getApiClient()["config"]?.getToken?.();

        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(`${baseUrl}/rpc/file/upload`, {
          method: "POST",
          headers,
          body: formData,
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error((errBody as Record<string, string>).error ?? `Upload failed: ${res.status}`);
        }

        const att = (await res.json()) as Attachment;
        return { id: att.id, filename: att.filename, download_url: att.download_url };
      } finally {
        setUploading(false);
      }
    },
    [onError],
  );

  const uploadWithToast = useCallback(
    async (file: File, ctx?: UploadContext): Promise<UploadResult | null> => {
      try {
        return await upload(file, ctx);
      } catch (err) {
        onError?.(err instanceof Error ? err : new Error("Upload failed"));
        return null;
      }
    },
    [upload, onError],
  );

  return { upload, uploadWithToast, uploading };
}
