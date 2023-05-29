package tools

import (
	"WebHome/src/utils"
	"encoding/json"
	"github.com/gin-gonic/gin"
	"io"
	"net/http"
	"time"
)

type timeConverterRequest struct {
	SourceTime string `json:"sourceTime"`
	TimeZone   string `json:"timeZone"`
	Precision  string `json:"precision"`
}

type timestampConverterRequest struct {
	Timestamp int64  `json:"timestamp"`
	TimeZone  string `json:"timeZone"`
	Precision string `json:"precision"`
}

func TimeConverter(c *gin.Context) {
	reqBody, _ := io.ReadAll(c.Request.Body)
	reqMap := &timeConverterRequest{}
	err := json.Unmarshal(reqBody, reqMap)
	if err != nil {
		panic(err)
	}
	location, err := time.LoadLocation(reqMap.TimeZone)
	if err != nil {
		panic(err)
	}
	var sourceTime *time.Time
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"response": "ERROR: Illegal time zone information."})
	}
	if reqMap.SourceTime == "" {
		sourceTimeObj := utils.GetCurrentTime()
		sourceTime = &sourceTimeObj
	} else {
		tTime := utils.ParseTimeString(reqMap.SourceTime)
		if tTime == nil {
			c.JSON(http.StatusBadRequest, gin.H{"response": "ERROR: Time formats that cannot be parsed."})
		} else {
			sourceTimeObj := time.Date(tTime.Year(), tTime.Month(), tTime.Day(), tTime.Hour(), tTime.Minute(), tTime.Second(), tTime.Nanosecond(), location)
			sourceTime = &sourceTimeObj
		}
	}
	switch reqMap.Precision {
	case "Milli":
		c.JSON(http.StatusOK, gin.H{"response": sourceTime.UnixMilli()})
		break
	default:
		c.JSON(http.StatusOK, gin.H{"response": sourceTime.Unix()})
		break
	}
}

func TimestampConverter(c *gin.Context) {
	reqBody, _ := io.ReadAll(c.Request.Body)
	reqMap := &timestampConverterRequest{}
	err := json.Unmarshal(reqBody, reqMap)
	if err != nil {
		panic(err)
	}
	var location *time.Location
	if reqMap.TimeZone == "" {
		location = time.Local
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"response": "ERROR: Illegal time zone information."})
		}
	} else {
		location, err = time.LoadLocation(reqMap.TimeZone)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"response": "ERROR: Illegal time zone information."})
		}
	}
	var resp string
	switch reqMap.Precision {
	case "Milli":
		ts := time.UnixMilli(reqMap.Timestamp).In(location)
		resp = ts.Format("2006-01-02 15:04:05.000")
		break
	default:
		ts := time.Unix(reqMap.Timestamp, 0).In(location)
		resp = ts.Format("2006-01-02 15:04:05")
		break
	}
	c.JSON(http.StatusOK, gin.H{"response": resp})
}
