package middleware

import (
	"net/http"
	"strings"

	"github.com/ai-development-coach/backend/internal/service"
	"github.com/gin-gonic/gin"
)

const UserIDKey = "userId"
const UserEmailKey = "userEmail"

func AuthRequired(auth *service.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if header == "" || !strings.HasPrefix(header, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "authentication required"})
			return
		}
		token := strings.TrimPrefix(header, "Bearer ")
		claims, err := auth.ValidateToken(token)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token"})
			return
		}
		c.Set(UserIDKey, claims.UserID)
		c.Set(UserEmailKey, claims.Email)
		c.Next()
	}
}

func GetUserID(c *gin.Context) string {
	v, _ := c.Get(UserIDKey)
	if s, ok := v.(string); ok {
		return s
	}
	return ""
}
