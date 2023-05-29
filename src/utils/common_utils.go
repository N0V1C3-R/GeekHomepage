package utils

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"github.com/bwmarrin/snowflake"
	"github.com/dgrijalva/jwt-go"
	"math/rand"
	"os"
	"regexp"
)

type Response struct {
	StatusCode   int
	ResponseText string
}

func GenerateSnowflake() int64 {
	node, err := snowflake.NewNode(1)
	if err != nil {
		panic(err)
	}
	unixTime := ConvertToNanoTime(GetCurrentTime()) + rand.Int63n(999)
	snowflakeId := node.Generate().Int64() + unixTime
	return snowflakeId
}

func GetToken(secretKey string) (string, error) {
	token := jwt.NewWithClaims(
		jwt.SigningMethodHS256,
		jwt.MapClaims{
			"exp": ConvertToMilliTime(GetCurrentTime()),
		},
	)
	tokenString, err := token.SignedString([]byte(secretKey))
	return tokenString, err
}

func VerifyToken(tokenString, secretKey string) (bool, error) {
	token, err := jwt.Parse(
		tokenString,
		func(token *jwt.Token) (interface{}, error) {
			return []byte(secretKey), nil
		},
	)
	if err != nil {
		return false, err
	}
	if !token.Valid {
		return false, nil
	}
	return true, nil
}

func SerializationObj(obj interface{}) string {
	jsonBytes, err := json.Marshal(obj)
	if err != nil {
		panic(err)
	}
	return string(jsonBytes)
}

func CreateFolder(filePath string) {
	if err := os.MkdirAll(filePath, 0777); err != nil {
		panic(err)
	}
}

func Base64EncodeString(stdIn []byte) string {
	return base64.StdEncoding.EncodeToString(stdIn)
}

func Base64DecodeString(stdIn string) (stdout []byte) {
	stdout, err := base64.StdEncoding.DecodeString(stdIn)
	if err != nil {
		return
	}
	return stdout
}

func IsBase64String(input string) bool {
	base64Pattern := "^[A-Za-z0-9+/]*={0,2}$"
	if len(input)%4 != 0 {
		return false
	}
	match, err := regexp.MatchString(base64Pattern, input)
	if err != nil {
		return false
	}
	return match
}

func GenerateVerificationCode() string {
	code := fmt.Sprintf("%06d", rand.Intn(1000000))
	return code
}
