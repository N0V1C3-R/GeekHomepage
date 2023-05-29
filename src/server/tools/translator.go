package tools

import (
	"WebHome/src/database"
	"WebHome/src/database/dao"
	"WebHome/src/server/middleware"
	"WebHome/src/utils"
	"bytes"
	"encoding/json"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"strconv"
)

func init() {
	_, file, _, _ := runtime.Caller(0)
	_ = os.Chdir(filepath.Dir(file))
	configPath := filepath.Join("..", "..", "config", ".env_local")
	_ = godotenv.Load(configPath)
	once.Do(
		func() {
			db, _ = database.ConnectDB(database.Mysql)
		})
}

const deepLAPI = "https://api-free.deepl.com/v2/translate"

type translateRequest struct {
	Text       string `json:"text"`
	TargetLang string `json:"targetLang"`
}

func Translator(c *gin.Context) {
	reqBody, _ := io.ReadAll(c.Request.Body)
	reqMap := &translateRequest{}
	err := json.Unmarshal([]byte(reqBody), reqMap)
	if err != nil {
		panic(err)
	}
	text := reqMap.Text
	targetLang := reqMap.TargetLang
	authKey := os.Getenv("DEEPL_API_KEY")
	if authKey == "" {
		userAuth := middleware.GetUserAuth(c)
		if userAuth.UserId == 0 {
			c.JSON(http.StatusUnauthorized, gin.H{"response": "ERROR: Failed to get the API Key."})
			return
		}
		authKey = parseDeepLAPIKey(authKey, userAuth, c)
		if authKey == "" {
			return
		}
	}
	response := TranslateText(text, targetLang, authKey)
	if response != nil {
		c.JSON(response.StatusCode, gin.H{"response": response.ResponseText})
	}
}

func TranslateText(text, targetLang, authKey string) *utils.Response {
	version := os.Getenv("VERSION")
	payload := bytes.NewBufferString(fmt.Sprintf("text=%s&target_lang=%s", text, targetLang))

	req, _ := http.NewRequest("POST", deepLAPI, payload)

	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Authorization", fmt.Sprintf("DeepL-Auth-Key %s", authKey))
	req.Header.Set("User-Agent", fmt.Sprintf("WebHome/%s", version))

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
	}
	defer func(Body io.ReadCloser) {
		_ = Body.Close()
	}(resp.Body)

	response := ParseResponse(resp)

	return &response
}

func ParseResponse(response *http.Response) (res utils.Response) {
	switch response.Status {
	case strconv.Itoa(http.StatusForbidden):
		res.StatusCode = http.StatusForbidden
		res.ResponseText = "Error: Blocked by CORS policy."
	case strconv.Itoa(http.StatusNotFound):
		res.StatusCode = http.StatusNotFound
		res.ResponseText = "Error: Server not found"
	case strconv.Itoa(http.StatusTooManyRequests):
		res.StatusCode = http.StatusTooManyRequests
		res.ResponseText = "Error: Too many requests, please try again later."
	case strconv.Itoa(456):
		res.StatusCode = http.StatusTooManyRequests
		res.ResponseText = "Error: The free translation quota is exceeded, please provide a new DeepL API key or upgrade DeepL subscription service."
	case strconv.Itoa(http.StatusInternalServerError):
		res.StatusCode = http.StatusInternalServerError
		res.ResponseText = "Error: DeepL server error, please try again later."
	default:
		res.StatusCode = response.StatusCode
	}

	var body map[string][]interface{}
	if err := json.NewDecoder(response.Body).Decode(&body); err != nil {
		res.ResponseText = fmt.Sprintf("Error: %s", err)
	}
	res.ResponseText = body["translations"][0].(map[string]interface{})["text"].(string)
	return
}

func parseDeepLAPIKey(authKey string, userAuth middleware.UserAuth, c *gin.Context) string {
	userApiKeyDao := dao.UserApiKeyDao{BaseDao: dao.BaseDao{DB: db}}
	authKey = userApiKeyDao.GetApiKey(userAuth.UserId, "DeepL")
	authKey = utils.DecryptCipherText(authKey, userAuth.Username)
	if authKey == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"response": "ERROR: Please set a valid API Key for the user."})
	}
	return authKey
}
