package dao

import "WebHome/src/database/model"

type UserApiKeyDao struct {
	BaseDao
	Schema model.UserApiKey
}

func (dao *UserApiKeyDao) GetApiKey(userId int64, serverName string) (apiKey string) {
	conditions := "user_id = ? AND server_name = ? and is_enabled = 1"
	values := []interface{}{userId, serverName}
	var UserApiKeyModel model.UserApiKey
	err := dao.Table(dao.Schema.TableName()).Select("api_key").Where(conditions, values...).First(&UserApiKeyModel)
	if err != nil {
		return UserApiKeyModel.ApiKey
	}
	return UserApiKeyModel.ApiKey
}

func (dao *UserApiKeyDao) CreateUserApiKey(userApiKeyModel model.UserApiKey) {
	err := dao.SingleInsert(&userApiKeyModel)
	if err != nil {
		return
	}
}
