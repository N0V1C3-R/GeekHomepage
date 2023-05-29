package dao

import (
	"WebHome/src/database/model"
	"strconv"
)

type BlogsDao struct {
	BaseDao
	Schema model.Blogs
}

func (dao *BlogsDao) SearchTitle(title string) (article model.Blogs) {
	_ = dao.Table(dao.Schema.TableName()).Where("title = ?", title).Find(&article)
	return
}

type AuthorCounts []struct {
	UserId int64 `json:"userId"`
	Count  int64 `json:"count"`
}

type ClassificationCounts []struct {
	Classification string `json:"classification"`
	Count          int64  `json:"count"`
}

type AuthorClassificationCounts []struct {
	UserId         int64  `json:"userId"`
	Classification string `json:"classification"`
	Count          int64  `json:"count"`
}

type BlogsCounts struct {
	AuthorCounts                      map[string]int64 `json:"authCounts"`
	ClassificationCounts              map[string]int64 `json:"classificationCounts"`
	AuthorClassificationCounts        map[string]int64 `json:"authorClassificationCounts"`
	AuthorVisibleCounts               map[string]int64 `json:"authorVisibleCounts"`
	AuthorVisibleClassificationCounts map[string]int64 `json:"authorVisibleClassificationCounts"`
	TotalCount                        int64            `json:"totalCount"`
}

func (dao *BlogsDao) Count() BlogsCounts {
	var (
		authorCounts                      AuthorCounts
		authorVisibleCounts               AuthorCounts
		classificationCounts              ClassificationCounts
		authorClassificationCounts        AuthorClassificationCounts
		authorVisibleClassificationCounts AuthorClassificationCounts
		blogCounts                        BlogsCounts
	)
	err := dao.Table(dao.Schema.TableName()).Where("deleted_at = 0").Count(&blogCounts.TotalCount)
	err = dao.Table(dao.Schema.TableName()).Select("user_id, COUNT(1) AS count").Where("deleted_at = 0").Group("user_id").Scan(&authorCounts)
	err = dao.Table(dao.Schema.TableName()).Select("user_id, COUNT(1) AS count").Where("is_anonymous = 0 AND deleted_at = 0").Group("user_id").Scan(&authorVisibleCounts)
	err = dao.Table(dao.Schema.TableName()).Select("classification, COUNT(1) AS count").Where("deleted_at = 0").Group("classification").Scan(&classificationCounts)
	err = dao.Table(dao.Schema.TableName()).Select("user_id, classification, COUNT(1) AS count").Where("deleted_at = 0").Group("user_id, classification").Scan(&authorClassificationCounts)
	err = dao.Table(dao.Schema.TableName()).Select("user_id, classification, COUNT(1) AS count").Where("is_anonymous = 0 AND deleted_at = 0").Group("user_id, classification").Scan(&authorVisibleClassificationCounts)
	if err.Error != nil {
		return blogCounts
	}
	authorCountsMap := make(map[string]int64)
	for _, res := range authorCounts {
		authorCountsMap[strconv.FormatInt(res.UserId, 10)] = res.Count
	}
	authorVisibleCountMap := make(map[string]int64)
	for _, res := range authorVisibleCounts {
		authorVisibleCountMap[strconv.FormatInt(res.UserId, 10)] = res.Count
	}
	classificationCountsMap := make(map[string]int64)
	for _, res := range classificationCounts {
		classificationCountsMap[res.Classification] = res.Count
	}
	authorClassificationCountsMap := make(map[string]int64)
	for _, res := range authorClassificationCounts {
		authorClassificationCountsMap[strconv.FormatInt(res.UserId, 10)+"-"+res.Classification] = res.Count
	}
	authorVisibleClassificationCountsMap := make(map[string]int64)
	for _, res := range authorVisibleClassificationCounts {
		authorVisibleClassificationCountsMap[strconv.FormatInt(res.UserId, 10)+"-"+res.Classification] = res.Count
	}
	blogCounts.AuthorCounts = authorCountsMap
	blogCounts.ClassificationCounts = classificationCountsMap
	blogCounts.AuthorClassificationCounts = authorClassificationCountsMap
	blogCounts.AuthorVisibleCounts = authorVisibleCountMap
	blogCounts.AuthorVisibleClassificationCounts = authorVisibleClassificationCountsMap
	return blogCounts
}

type BlogProfile struct {
	UserId       int64
	Title        string
	IsAnonymous  bool
	TotalReviews int
	Stars        int
	CreatedAt    int64
}

func (dao *BlogsDao) GetBlogProfiles(userId int64, classification string, page int, onlyVisible bool) []BlogProfile {
	query := dao.Table(dao.Schema.TableName()).Select("user_id, title, is_anonymous, total_reviews, stars, created_at").Where("deleted_at = 0")
	if userId != 0 {
		query = query.Where("user_id = ?", userId)
	}
	if classification != "" {
		query = query.Where("classification = ?", classification)
	}
	if onlyVisible {
		query = query.Where("is_anonymous = 0")
	}
	var blogProfiles []BlogProfile
	query.Order("created_at DESC").Limit(10).Offset(page * 10).Find(&blogProfiles)
	return blogProfiles
}

func (dao *BlogsDao) GetBlogDetail(title string) model.Blogs {
	var blog model.Blogs
	dao.Table(dao.Schema.TableName()).Where("title = ?", title).Find(&blog)
	return blog
}
