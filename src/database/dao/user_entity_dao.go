package dao

import (
	"WebHome/src/database/model"
	"WebHome/src/utils"
)

type UserEntityDao struct {
	BaseDao
	Schema model.UserEntity
}

func (dao *UserEntityDao) CreateSuperAdminUser(userModel model.UserEntity) {
	userModel.Role = model.SuperAdmin
	err := dao.SingleInsert(&userModel)
	if err != nil {
		return
	}
}

func (dao *UserEntityDao) CreateAdminUser(userModel model.UserEntity) {
	userModel.Role = model.Admin
	err := dao.SingleInsert(&userModel)
	if err != nil {
		return
	}
}

func (dao *UserEntityDao) CreateClientUser(userModel model.UserEntity) *model.UserEntity {
	userModel.Role = model.Client
	err := dao.SingleInsert(&userModel)
	if err != nil {
		return nil
	}
	return &userModel
}

func (dao *UserEntityDao) GetUser(email, password string) (user model.UserEntity) {
	condition := "email = ? AND password = ? AND active = ? AND deleted_at = ?"
	values := []interface{}{email, password, 1, 0}
	dao.Where(condition, values...).First(&user)
	return
}

func (dao *UserEntityDao) IsUserExists(email string) (user model.UserEntity) {
	condition := "email = ? AND active = ? AND deleted_at = ?"
	values := []interface{}{email, 1, 0}
	dao.Where(condition, values...).First(&user)
	return
}

func (dao *UserEntityDao) UpdateUserLoginTime(userId int64) {
	_ = dao.Table(dao.Schema.TableName()).Where("id=?", userId).Update("last_login_at", utils.ConvertToMilliTime(utils.GetCurrentTime()))
}

func (dao *UserEntityDao) SearchUserId(username string) (int64, bool) {
	var user model.UserEntity
	err := dao.Table(dao.Schema.TableName()).Where("username = ?", username).Find(&user)
	if err.Error != nil {
		return 0, false
	}
	return user.Id, user.Active
}

func (dao *UserEntityDao) FindUserListByUserId(userIdList []int64) []model.UserEntity {
	var userList []model.UserEntity
	dao.Table(dao.Schema.TableName()).Where("id IN ?", userIdList).Find(&userList)
	return userList
}
