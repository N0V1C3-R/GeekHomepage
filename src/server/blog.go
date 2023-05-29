package server

import (
	"WebHome/src/database/dao"
	"WebHome/src/server/middleware"
	"bytes"
	"encoding/json"
	"fmt"
	"github.com/gin-gonic/gin"
	"html/template"
	"math"
	"net/http"
	"strconv"
)

const articlesPerPage = 10

func BlogListHandler(c *gin.Context) {
	blogsDao := dao.BlogsDao{BaseDao: dao.BaseDao{DB: db}}
	userEntityDao = dao.UserEntityDao{BaseDao: dao.BaseDao{DB: db}}
	res, err := rdb.Get(ctx, "blogCounts").Result()
	var (
		articleCounts        dao.BlogsCounts
		count                int64
		totalPages           int
		articlesProfilesList []dao.BlogProfile
		userIdUsernameMap    map[int64]string
	)
	authorName := c.Query("authorName")
	page, _ := strconv.Atoi(c.Query("page"))
	classification := c.Query("classification")
	if err != nil {
		articleCounts = updateBlogsCount(blogsDao)
	}
	err = json.Unmarshal([]byte(res), &articleCounts)
	if c.Request.Method == http.MethodGet && authorName != "" {
		userId, _ := userEntityDao.SearchUserId(authorName)
		userAuth := middleware.GetUserAuth(c)
		var onlyVisible bool
		if userId != userAuth.UserId {
			onlyVisible = true
		} else {
			onlyVisible = false
		}
		count = getBlogCount(articleCounts, userId, classification, onlyVisible)
		articlesProfilesList, userIdUsernameMap = getBlogProfilesList(blogsDao, userEntityDao, userId, classification, page, onlyVisible)
	} else if c.Request.Method == http.MethodGet && authorName == "" {
		count = getBlogCount(articleCounts, 0, classification, false)
		articlesProfilesList, userIdUsernameMap = getBlogProfilesList(blogsDao, userEntityDao, 0, classification, page, false)
	}
	totalPages = int(math.Ceil(float64(count) / float64(articlesPerPage)))
	if page > totalPages {
		page = totalPages
	} else if page == 0 {
		page = 1
	}
	paginationHTML := generatePaginationHTML(totalPages, page)
	fmt.Println(c.Request.URL)
	c.HTML(http.StatusOK, "bloglist.html",
		gin.H{
			"title":             "Blogs",
			"articles":          articlesProfilesList,
			"userIdUserNameMap": userIdUsernameMap,
			"paginationHTML":    template.HTML(paginationHTML),
		})
}

func generatePaginationHTML(totalPages, currentPage int) string {
	var buffer bytes.Buffer
	if currentPage > 1 {
		buffer.WriteString(`<a href="blogs?page=`)
		buffer.WriteString(strconv.Itoa(currentPage - 1))
		buffer.WriteString(`">Pre</a>`)
	}

	for i := 1; i <= totalPages; i++ {
		if i == currentPage {
			buffer.WriteString(`<span class="current">`)
			buffer.WriteString(strconv.Itoa(i))
			buffer.WriteString(`</span>`)
		} else {
			buffer.WriteString(`<a href="/blogs?page=`)
			buffer.WriteString(strconv.Itoa(i))
			buffer.WriteString(`">`)
			buffer.WriteString(strconv.Itoa(i))
			buffer.WriteString(`</a>`)
		}
	}

	if currentPage < totalPages {
		buffer.WriteString(`<a href="/blogs?page=`)
		buffer.WriteString(strconv.Itoa(currentPage + 1))
		buffer.WriteString(`">Next</a>`)
	}

	return buffer.String()
}

func ReadHandle(c *gin.Context) {
	title := c.Param("title")
	blogsDao := dao.BlogsDao{BaseDao: dao.BaseDao{DB: db}}
	entity := blogsDao.GetBlogDetail(title)
	if entity.Id == 0 {
		c.HTML(http.StatusNotFound, "404.html", gin.H{"title": "Blog Not Found", "text": "404 - Article does not exist."})
	} else if entity.DeletedAt != 0 {
		c.HTML(http.StatusNotFound, "404.html", gin.H{"title": "Blog Not Found", "text": "404 - Article has been deleted."})
	} else {
		userAuth := middleware.GetUserAuth(c)
		if userAuth.UserId == entity.UserID {
			c.HTML(http.StatusOK, "blogdetail.html", gin.H{"title": entity.Title, "edit": true, "content": entity.Content, "isAnonymous": entity.IsAnonymous})
		} else {
			c.HTML(http.StatusOK, "blogdetail.html", gin.H{"title": entity.Title, "edit": false, "content": entity.Content, "isAnonymous": entity.IsAnonymous})
		}
	}
}

func EditArticle(c *gin.Context) {
	title := c.Param("title")
	if title != "" {
		userAuth := middleware.GetUserAuth(c)
		blogsDao := dao.BlogsDao{BaseDao: dao.BaseDao{DB: db}}
		article := blogsDao.SearchTitle(title)
		if article.UserID == userAuth.UserId {
			c.HTML(http.StatusOK, "blogedit.html", gin.H{"title": title, "content": article.Content})
			return
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"response": "ERROR: This user does not have edit permissions."})
			return
		}
	} else {
		c.HTML(http.StatusOK, "blogedit.html", gin.H{"title": ""})
	}
}

func SaveArticle(c *gin.Context) {
}

func updateBlogsCount(blogsDao dao.BlogsDao) dao.BlogsCounts {
	data := blogsDao.Count()
	blogsCount, _ := json.Marshal(data)
	rdb.Set(ctx, "blogCounts", blogsCount, 0)
	return data
}

func getBlogCount(blogsCounts dao.BlogsCounts, userId int64, classification string, onlyVisible bool) int64 {
	var blogCount int64
	switch userId {
	case 0:
		if classification == "" {
			blogCount = blogsCounts.TotalCount
		} else {
			blogCount = blogsCounts.ClassificationCounts[classification]
		}
	default:
		if onlyVisible && classification != "" {
			blogCount = blogsCounts.AuthorVisibleClassificationCounts[strconv.FormatInt(userId, 10)+"-"+classification]
		} else if onlyVisible && classification == "" {
			blogCount = blogsCounts.AuthorVisibleCounts[strconv.FormatInt(userId, 10)]
		} else if !onlyVisible && classification != "" {
			blogCount = blogsCounts.AuthorClassificationCounts[strconv.FormatInt(userId, 10)+"-"+classification]
		} else {
			blogCount = blogsCounts.AuthorCounts[strconv.FormatInt(userId, 10)]
		}
	}
	return blogCount
}

func getBlogProfilesList(blogsDao dao.BlogsDao, userDao dao.UserEntityDao, userId int64, classification string, page int, onlyVisible bool) ([]dao.BlogProfile, map[int64]string) {
	blogProfilesList := blogsDao.GetBlogProfiles(userId, classification, page-1, onlyVisible)
	var userIdList []int64
	deDuplicateMap := make(map[int64]bool)
	for _, profile := range blogProfilesList {
		if !deDuplicateMap[profile.UserId] {
			deDuplicateMap[profile.UserId] = true
			userIdList = append(userIdList, profile.UserId)
		}
	}
	userList := userDao.FindUserListByUserId(userIdList)
	userIdUsernameMap := make(map[int64]string)
	for _, user := range userList {
		userIdUsernameMap[user.Id] = user.Username
	}
	return blogProfilesList, userIdUsernameMap
}
