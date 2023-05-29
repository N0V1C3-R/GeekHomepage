package dao

import (
	"WebHome/src/database/model"
)

type ExchangeRateDao struct {
	BaseDao
	Schema model.ExchangeRate
}

func (dao *ExchangeRateDao) GetLastTradingDay() (LastTradingDay string) {
	err := dao.Table(dao.Schema.TableName()).Select("max(trade_date)").Row().Scan(&LastTradingDay)
	if err != nil {
		return ""
	}
	return
}

func (dao *ExchangeRateDao) GetTheLatestUpdateTime() (updatedAt int64) {
	err := dao.Table(dao.Schema.TableName()).Select("max(updated_at)").Row().Scan(&updatedAt)
	if err != nil {
		return
	}
	return
}

func (dao *ExchangeRateDao) FlushUpdateTime(updatedAt int64) {
	_ = dao.Table(dao.Schema.TableName()).Where("updated_at<?", updatedAt).Update("updated_at", updatedAt)
}
