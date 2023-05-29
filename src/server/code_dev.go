package server

import (
	"WebHome/src/database/dao"
	"WebHome/src/server/middleware"
	"WebHome/src/utils"
	"bytes"
	"encoding/json"
	"github.com/gin-gonic/gin"
	"io"
	"net/http"
	"os"
)

type submissionRequest struct {
	Stdin      string `json:"stdin"`
	LanguageID int    `json:"language_id"`
	SourceCode string `json:"source_code"`
}

type submissionToken struct {
	Token string `json:"token"`
}

type resultRequest struct {
	Stdout        string      `json:"stdout"`
	Time          string      `json:"time"`
	Memory        int         `json:"memory"`
	Stderr        string      `json:"stderr"`
	Token         string      `json:"token"`
	CompileOutput string      `json:"compile_output"`
	Message       string      `json:"message"`
	Status        interface{} `json:"status"`
}

const judge0API = "https://judge0-ce.p.rapidapi.com/submissions/"
const judge0TokenUrl = "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=true&fields=*"

func CodeDevHandle(c *gin.Context) {
	if c.Request.Method == http.MethodGet {
		token, err := utils.GetToken(secretKey)
		if err != nil {
			c.AbortWithStatus(http.StatusInternalServerError)
			return
		}
		c.SetCookie(cookieName, token, cookieMaxAge, "/", "", false, true)
		c.HTML(http.StatusOK, "codedev.html", gin.H{"title": "CodeV"})
	} else if c.Request.Method == http.MethodPost {
		postJudge0API(c)
	}
}

func postJudge0API(c *gin.Context) {
	reqBody, _ := io.ReadAll(c.Request.Body)
	reqMap := &codeMsg{}
	err := json.Unmarshal(reqBody, reqMap)
	if err != nil {
		panic(err)
	}
	inputValue := reqMap.InputValue
	languageId := reqMap.LanguageID
	sourceCode := reqMap.SourceCode

	authKey := os.Getenv("JUDGE0_API_KEY")
	if authKey == "" {
		userAuth := middleware.GetUserAuth(c)
		if userAuth.UserId == 0 {
			c.JSON(http.StatusUnauthorized, gin.H{"response": "ERROR: Failed to get user information."})
			return
		}
		authKey = parseJudge0APIKey(authKey, userAuth, c)
		if authKey == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"response": "ERROR: Failed to get the API Key."})
			return
		}
	}

	if sourceCode == "" {
		c.JSON(http.StatusBadRequest, gin.H{"response": "Source code can't be empty!"})
		return
	}

	if utils.IsBase64String(inputValue) || utils.IsBase64String(sourceCode) {
		c.JSON(http.StatusBadRequest, gin.H{"response": "ERROR: Please enter the correct parameters."})
		return
	}

	token := requestToken(inputValue, sourceCode, authKey, languageId)
	requestResult(token, authKey, c)
}

func parseJudge0APIKey(authKey string, userAuth middleware.UserAuth, c *gin.Context) string {
	userApiKeyDao := dao.UserApiKeyDao{BaseDao: dao.BaseDao{DB: db}}
	authKey = userApiKeyDao.GetApiKey(userAuth.UserId, "Judge0")
	authKey = utils.DecryptCipherText(authKey, userAuth.Username)
	if authKey == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"response": "ERROR: Please set a valid API Key for the user."})
	}
	return authKey
}

func requestToken(inputValue, sourceCode, authKey string, languageId int) string {
	submissionRequest := submissionRequest{
		Stdin:      utils.Base64EncodeString([]byte(inputValue)),
		LanguageID: languageId,
		SourceCode: utils.Base64EncodeString([]byte(sourceCode)),
	}
	requestBody, err := json.Marshal(submissionRequest)

	payload := bytes.NewBuffer(requestBody)

	req, _ := http.NewRequest("POST", judge0TokenUrl, payload)

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-RapidAPI-Key", authKey)
	req.Header.Add("X-RapidAPI-Host", "judge0-ce.p.rapidapi.com")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
	}
	defer func(Body io.ReadCloser) {
		_ = Body.Close()
	}(resp.Body)

	var submissionToken submissionToken
	err = json.NewDecoder(resp.Body).Decode(&submissionToken)

	return submissionToken.Token
}

func requestResult(token, authKey string, c *gin.Context) {
	if token == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"response": "ERROR: Illegal token."})
	}
	req, _ := http.NewRequest("GET", judge0API+token, nil)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-RapidAPI-Key", authKey)
	req.Header.Add("X-RapidAPI-Host", "judge0-ce.p.rapidapi.com")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"response": "ERROR: Bad requests."})
	}
	defer func(Body io.ReadCloser) {
		_ = Body.Close()
	}(resp.Body)

	var resultRequest resultRequest
	err = json.NewDecoder(resp.Body).Decode(&resultRequest)
	if err != nil {

	}

	c.JSON(http.StatusOK, gin.H{"response": resultRequest})
}
