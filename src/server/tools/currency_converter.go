package tools

import (
	"WebHome/src/crontab_job"
	"WebHome/src/database"
	"WebHome/src/database/dao"
	"WebHome/src/database/model"
	"encoding/json"
	"fmt"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"io"
	"net/http"
	"sync"
	"time"
)

var (
	once sync.Once
	db   *gorm.DB
)

func init() {
	once.Do(
		func() {
			db, _ = database.ConnectDB(database.Mysql)
		})
}

type currencyRequest struct {
	SourceCurrency string `json:"sourceCurrency"`
	TargetCurrency string `json:"targetCurrency"`
}

func CurrencyConverter(c *gin.Context) {
	reqBody, _ := io.ReadAll(c.Request.Body)
	reqMap := &currencyRequest{}
	err := json.Unmarshal(reqBody, reqMap)
	if err != nil {
		panic(err)
	}
	sourceCurrency := reqMap.SourceCurrency
	targetCurrency := reqMap.TargetCurrency
	rate := CurrencyConvert(sourceCurrency, targetCurrency)
	c.JSON(http.StatusOK, gin.H{"response": rate})
}

func CurrencyConvert(sourceCurrency, targetCurrency string) string {
	exchangeRateDao := dao.ExchangeRateDao{BaseDao: dao.BaseDao{DB: db}}
	exchangeRateInfo := getExchangeRateInfo(sourceCurrency, targetCurrency, exchangeRateDao)
	var sourceRate, targetRate *float64
	var sourceIsDirectQuotation, targetIsDirectQuotation bool
	if exchangeRateInfo["sourceCurrency"] != nil {
		sourceRate = exchangeRateInfo["sourceCurrency"].Value
		sourceIsDirectQuotation = exchangeRateInfo["sourceCurrency"].IsDirectQuotation
	} else if sourceCurrency == "CNY" {
		var CNYRate = 1.0
		sourceRate = &CNYRate
		sourceIsDirectQuotation = true
	}
	if exchangeRateInfo["targetCurrency"] != nil {
		targetRate = exchangeRateInfo["targetCurrency"].Value
		targetIsDirectQuotation = exchangeRateInfo["targetCurrency"].IsDirectQuotation
	} else if targetCurrency == "CNY" {
		var CNYRate = 1.0
		targetRate = &CNYRate
		targetIsDirectQuotation = true
	}
	if sourceRate != nil && targetRate != nil {
		return calculateExchangeRate(sourceRate, targetRate, sourceIsDirectQuotation, targetIsDirectQuotation)
	} else if sourceRate == nil {
		return "-1.0"
	} else {
		return "-2.0"
	}
}

func getExchangeRateInfo(sourceCurrency, targetCurrency string, dao dao.ExchangeRateDao) map[string]*model.ExchangeRate {
	updateExchangeRateData(dao)
	lastTradeDay := dao.GetLastTradingDay()
	if lastTradeDay != "" {
		var exchangeRateInfo []model.ExchangeRate
		if sourceCurrency == "CNY" {
			_ = dao.
				Where("trade_date=? AND foreign_currency=?",
					lastTradeDay, targetCurrency).
				Find(&exchangeRateInfo)
		} else if targetCurrency == "CNY" {
			_ = dao.
				Where("trade_date=? AND foreign_currency=?",
					lastTradeDay, sourceCurrency).
				Find(&exchangeRateInfo)
		} else {
			_ = dao.
				Where("trade_date=? AND (foreign_currency=? OR foreign_currency=?)",
					lastTradeDay, sourceCurrency, targetCurrency).
				Find(&exchangeRateInfo)
		}
		rateInfo := map[string]*model.ExchangeRate{
			"sourceCurrency": nil,
			"targetCurrency": nil,
		}
		for _, rate := range exchangeRateInfo {
			if rate.ForeignCurrency == sourceCurrency {
				rateCopy := rate
				rateInfo["sourceCurrency"] = &rateCopy
			} else {
				rateCopy := rate
				rateInfo["targetCurrency"] = &rateCopy
			}
		}
		return rateInfo
	} else {
		return nil
	}
}

func updateExchangeRateData(dao dao.ExchangeRateDao) {
	latestUpdateTime := dao.GetTheLatestUpdateTime()
	location, _ := time.LoadLocation("Asia/Shanghai")
	updatedTime := time.UnixMilli(latestUpdateTime).In(location)
	todayTime := time.Now()
	if updatedTime.Before(time.Date(todayTime.Year(), todayTime.Month(), todayTime.Day(), 9, 15, 59, 0, location)) &&
		todayTime.After(time.Date(todayTime.Year(), todayTime.Month(), todayTime.Day(), 9, 15, 59, 0, location)) {
		crontab_job.ExchangeRateProcess()
		dao.FlushUpdateTime(todayTime.UnixMilli())
	}
}

func calculateExchangeRate(sourceRate, targetRate *float64, sourceIsDirectQuotation, targetIsDirectQuotation bool) string {
	var res float64
	if sourceIsDirectQuotation == true && targetIsDirectQuotation == true {
		res = *sourceRate / *targetRate
	} else if sourceIsDirectQuotation == false && targetIsDirectQuotation == false {
		res = 1 / *sourceRate * *targetRate
	} else if sourceIsDirectQuotation == true && targetIsDirectQuotation == false {
		res = *sourceRate * *targetRate
	} else {
		res = 1 / (*sourceRate * *targetRate)
	}
	return fmt.Sprintf("%.4f", res)
}
