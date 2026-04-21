package service

import (
	"context"
	"crypto/rand"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/openzoo-ai/openzoo/server/internal/auth"
	"github.com/openzoo-ai/openzoo/server/internal/database"
)

type User struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	AvatarURL string    `json:"avatar_url"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func SendVerificationCode(ctx context.Context, email string) error {
	// In production: send email via SMTP
	// For now: log the code
	code := generateCode(6)
	pool := database.Pool()
	_, err := pool.Exec(ctx,
		`INSERT INTO verification_codes (id, email, code, expires_at, created_at)
		 VALUES ($1, $2, $3, NOW() + INTERVAL '10 minutes', NOW())
		 ON CONFLICT (email) DO UPDATE SET code = $3, expires_at = NOW() + INTERVAL '10 minutes', attempts = 0, created_at = NOW()`,
		uuid.New().String(), email, code,
	)
	if err != nil {
		return err
	}
	log.Printf("verification code for %s: %s", email, code)
	return nil
}

func VerifyCode(ctx context.Context, email, code string) (string, *User, error) {
	pool := database.Pool()

	var storedCode string
	var expiresAt time.Time
	err := pool.QueryRow(ctx,
		`SELECT code, expires_at FROM verification_codes WHERE email = $1`, email,
	).Scan(&storedCode, &expiresAt)
	if err != nil {
		return "", nil, fmt.Errorf("invalid email or code")
	}

	if time.Now().After(expiresAt) {
		return "", nil, fmt.Errorf("code expired")
	}

	if storedCode != code {
		// Increment attempts
		_, _ = pool.Exec(ctx, `UPDATE verification_codes SET attempts = attempts + 1 WHERE email = $1`, email)
		return "", nil, fmt.Errorf("invalid code")
	}

	// Find or create user
	user, err := findOrCreateUser(ctx, email)
	if err != nil {
		return "", nil, err
	}

	// Generate JWT token
	token, err := auth.GenerateToken(user.ID, user.Email)
	if err != nil {
		return "", nil, err
	}

	// Clean up used code
	_, _ = pool.Exec(ctx, `DELETE FROM verification_codes WHERE email = $1`, email)

	return token, user, nil
}

func LoginWithToken(ctx context.Context, tokenStr string) (string, *User, error) {
	claims, err := auth.ValidateToken(tokenStr)
	if err != nil {
		return "", nil, err
	}
	user, err := GetUserByID(ctx, claims.UserID)
	if err != nil {
		return "", nil, err
	}
	// Generate fresh token
	token, err := auth.GenerateToken(user.ID, user.Email)
	if err != nil {
		return "", nil, err
	}
	return token, user, nil
}

func GetCurrentUser(ctx context.Context) (*User, error) {
	userID := ctx.Value("user_id").(string)
	return GetUserByID(ctx, userID)
}

func UpdateUser(ctx context.Context, userID string, fields map[string]interface{}) (*User, error) {
	pool := database.Pool()
	allowedFields := map[string]bool{"name": true, "avatar_url": true}
	setClauses := ""
	args := []interface{}{userID}
	i := 2
	for k, v := range fields {
		if !allowedFields[k] {
			continue
		}
		if setClauses != "" {
			setClauses += ", "
		}
		setClauses += fmt.Sprintf("%s = $%d", k, i)
		args = append(args, v)
		i++
	}
	if setClauses == "" {
		return GetUserByID(ctx, userID)
	}
	setClauses += fmt.Sprintf(", updated_at = $%d", i)
	args = append(args, time.Now())
	query := fmt.Sprintf("UPDATE users SET %s WHERE id = $1", setClauses)
	_, err := pool.Exec(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("update user: %w", err)
	}
	return GetUserByID(ctx, userID)
}

func GetUserByID(ctx context.Context, userID string) (*User, error) {
	pool := database.Pool()
	var u User
	err := pool.QueryRow(ctx,
		`SELECT id, name, email, COALESCE(avatar_url, ''), created_at, updated_at FROM users WHERE id = $1`,
		userID,
	).Scan(&u.ID, &u.Name, &u.Email, &u.AvatarURL, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}
	return &u, nil
}

func findOrCreateUser(ctx context.Context, email string) (*User, error) {
	pool := database.Pool()

	// Try to find existing user
	var u User
	err := pool.QueryRow(ctx,
		`SELECT id, name, email, COALESCE(avatar_url, ''), created_at, updated_at FROM users WHERE email = $1`,
		email,
	).Scan(&u.ID, &u.Name, &u.Email, &u.AvatarURL, &u.CreatedAt, &u.UpdatedAt)
	if err == nil {
		return &u, nil
	}

	// Create new user
	id := uuid.New().String()
	name := email // Default name to email
	err = pool.QueryRow(ctx,
		`INSERT INTO users (id, name, email, created_at, updated_at)
		 VALUES ($1, $2, $3, NOW(), NOW())
		 RETURNING id, name, email, COALESCE(avatar_url, ''), created_at, updated_at`,
		id, name, email,
	).Scan(&u.ID, &u.Name, &u.Email, &u.AvatarURL, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("create user: %w", err)
	}
	return &u, nil
}

func generateCode(length int) string {
	b := make([]byte, length)
	_, _ = rand.Read(b)
	for i := range b {
		b[i] = '0' + b[i]%10
	}
	return string(b)
}
