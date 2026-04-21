-- OpenZoo Database Schema
-- Migration 002: Labels, Cycles, Views (Rollback)

DROP INDEX IF EXISTS idx_views_creator;
DROP INDEX IF EXISTS idx_views_workspace;
DROP TABLE IF EXISTS views;

DROP INDEX IF EXISTS idx_cycle_issues_issue;
DROP INDEX IF EXISTS idx_cycle_issues_cycle;
DROP TABLE IF EXISTS cycle_issues;

DROP INDEX IF EXISTS idx_cycles_status;
DROP INDEX IF EXISTS idx_cycles_workspace;
DROP TABLE IF EXISTS cycles;

DROP INDEX IF EXISTS idx_issue_labels_label;
DROP INDEX IF EXISTS idx_issue_labels_issue;
DROP TABLE IF EXISTS issue_labels;

DROP INDEX IF EXISTS idx_labels_workspace;
DROP TABLE IF EXISTS labels;
