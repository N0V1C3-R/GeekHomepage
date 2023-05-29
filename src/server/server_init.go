package server

import (
	"WebHome/src/database"
	redisC "WebHome/src/redis"
	"context"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
	"sync"
)

type registerForm struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type loginForm struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type emailVerifyForm struct {
	Code string `json:"code"`
}

type userCookie struct {
	UserId   int64  `json:"uid"`
	Username string `json:"username"`
	Role     string `json:"role"`
}

type loginInfo struct {
	Username string `json:"username"`
	IP       string `json:"IP"`
}

type codeMsg struct {
	InputValue string `json:"inputValue"`
	LanguageID int    `json:"languageID"`
	SourceCode string `json:"sourceCode"`
}

var (
	once      sync.Once
	db        *gorm.DB
	rdb       *redis.Client
	ctx       context.Context
	secretKey = "123"
	username  = "Visitor"
)

const (
	cookieName   = "token"
	cookieMaxAge = 3600
)

func init() {
	once.Do(
		func() {
			db, _ = database.ConnectDB(database.Mysql)
			rdb = redisC.ConnectionRedis()
			ctx = context.Background()
		})
}
