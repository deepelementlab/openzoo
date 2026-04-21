import { invalidateQuery } from "../query-client";

export function onInboxNew() {
  invalidateQuery(["inbox", "list"]);
}

export function onInboxIssueStatusChanged() {
  invalidateQuery(["inbox", "list"]);
}

export function onInboxInvalidate() {
  invalidateQuery(["inbox", "list"]);
}
