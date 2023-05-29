package model

import "WebHome/src/utils"

type UserApiKey struct {
	BaseModel
	UserID     int64  `gorm:"column:user_id;not null"`
	ServerName string `gorm:"column:server_name;not null"`
	ApiKey     string `gorm:"column:api_key;not null"`
	IsEnabled  bool   `gorm:"column:is_enabled;not null"`
}

func (*UserApiKey) TableName() string {
	return "user_api_key"
}

func NewUserApiKey() *UserApiKey {
	return &UserApiKey{
		BaseModel: *NewBaseModel(),
	}
}

func (model *UserApiKey) CreateData(userId int64, serverName, apiKey, username string) UserApiKey {
	model.UserID = userId
	model.ServerName = serverName
	model.ApiKey = utils.EncryptPlainText([]byte(apiKey), username)
	model.IsEnabled = true
	return *model
}
