package auth

import (
	"github.com/golang-jwt/jwt/v5"
)

type Helper struct{}

func NewHelper() *Helper { return &Helper{} }

func (h *Helper) GenerateToken(userID, email string) (string, error) {
	return GenerateToken(userID, email)
}

func (h *Helper) ValidateToken(tokenStr string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		return jwtSecret(), nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, err
	}
	return claims, nil
}
