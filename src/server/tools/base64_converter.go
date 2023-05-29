package tools

import (
	"WebHome/src/utils"
	"encoding/json"
	"github.com/gin-gonic/gin"
	"io"
	"net/http"
)

type base64ConverterRequest struct {
	SourceString string `json:"sourceString"`
}

func Base64Encoder(c *gin.Context) {
	reqBody, _ := io.ReadAll(c.Request.Body)
	reqMap := &base64ConverterRequest{}
	err := json.Unmarshal(reqBody, reqMap)
	if err != nil {
		panic(err)
	}
	c.JSON(http.StatusOK, gin.H{"response": utils.Base64EncodeString([]byte(reqMap.SourceString))})
}

func Base64Decoder(c *gin.Context) {
	reqBody, _ := io.ReadAll(c.Request.Body)
	reqMap := &base64ConverterRequest{}
	err := json.Unmarshal(reqBody, reqMap)
	if err != nil {
		panic(err)
	}
	if !utils.IsBase64String(reqMap.SourceString) {
		c.JSON(http.StatusBadRequest, gin.H{"response": "ERROR: Illegal Base64-encoded string"})
	} else {
		c.JSON(http.StatusOK, gin.H{"response": string(utils.Base64DecodeString(reqMap.SourceString))})
	}
}
