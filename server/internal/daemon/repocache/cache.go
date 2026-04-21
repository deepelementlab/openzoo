package repocache

import (
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
)

type Cache struct {
	root   string
	logger *log.Logger
	locks  sync.Map
}

func New(root string, logger *log.Logger) *Cache {
	os.MkdirAll(root, 0755)
	return &Cache{root: root, logger: logger}
}

func (c *Cache) lockFor(key string) *sync.Mutex {
	val, _ := c.locks.LoadOrStore(key, &sync.Mutex{})
	return val.(*sync.Mutex)
}

func (c *Cache) Sync(workspaceID string, repos []string) error {
	wsDir := filepath.Join(c.root, workspaceID)
	os.MkdirAll(wsDir, 0755)

	for _, url := range repos {
		name := repoNameFromURL(url)
		barePath := filepath.Join(wsDir, name+".git")

		mu := c.lockFor(barePath)
		mu.Lock()
		defer mu.Unlock()

		if _, err := os.Stat(barePath); err == nil {
			c.gitFetch(barePath)
			continue
		}

		c.logger.Printf("cloning %s -> %s", url, barePath)
		cmd := exec.Command("git", "clone", "--bare", url, barePath)
		if out, err := cmd.CombinedOutput(); err != nil {
			c.logger.Printf("clone failed: %v: %s", err, string(out))
		}
	}
	return nil
}

func (c *Cache) Lookup(workspaceID, url string) (string, bool) {
	name := repoNameFromURL(url)
	barePath := filepath.Join(c.root, workspaceID, name+".git")
	if _, err := os.Stat(barePath); err == nil {
		return barePath, true
	}
	return "", false
}

func (c *Cache) Fetch(barePath string) error {
	return c.gitFetch(barePath)
}

func (c *Cache) CreateWorktree(barePath, targetDir, branch string) error {
	os.MkdirAll(filepath.Dir(targetDir), 0755)
	cmd := exec.Command("git", "worktree", "add", targetDir, "-b", branch, "HEAD")
	cmd.Dir = barePath
	if out, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("worktree add: %v: %s", err, string(out))
	}
	return nil
}

func (c *Cache) gitFetch(barePath string) error {
	cmd := exec.Command("git", "fetch", "origin")
	cmd.Dir = barePath
	if out, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("fetch %s: %v: %s", barePath, err, string(out))
	}
	return nil
}

func repoNameFromURL(url string) string {
	name := filepath.Base(url)
	name = strings.TrimSuffix(name, ".git")
	return name
}
