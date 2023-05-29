package main

import (
	"WebHome/src/server"
	"WebHome/src/server/tools"
	"github.com/gin-gonic/gin"
	"html/template"
	"time"
)

func main() {
	router := gin.Default()
	templateFuncRegister(router)
	routingRegistration(router)
	_ = router.Run(":5466")
}

func routingRegistration(router *gin.Engine) {
	router.LoadHTMLGlob("../../templates/html/*")
	router.Static("/templates", "../../templates")

	router.NoRoute(server.PageNotFound)

	toolsGroupsRegistration(router)
	registerGroupRegistration(router)
	blogGroupRegistration(router)

	router.GET("/", server.HomeHandle)
	router.GET("/hello", server.WelcomeHandle)
	router.Any("/login", server.LoginHandle)
	router.POST("/logout", server.LogoutHandle)
	router.POST("/verify", server.VerifyCode)
	router.Any("/codev", server.CodeDevHandle)
}

func toolsGroupsRegistration(router *gin.Engine) {
	toolsGroup := router.Group("/tools")
	{
		toolsGroup.GET("/obj_comparator", server.ObjComparator)
		toolsGroup.POST("/translator", tools.Translator)
		toolsGroup.POST("/currency_converter", tools.CurrencyConverter)
		toolsGroup.POST("/base64_encoder", tools.Base64Encoder)
		toolsGroup.POST("/base64_decoder", tools.Base64Decoder)
		toolsGroup.POST("/time_converter", tools.TimeConverter)
		toolsGroup.POST("/timestamp_converter", tools.TimestampConverter)
	}
}

func registerGroupRegistration(router *gin.Engine) {
	registerGroup := router.Group("/register")
	{
		registerGroup.Any("", server.RegisterHandle)
		registerGroup.POST("/verify_code", server.EmailVerify)
		registerGroup.POST("/create_user", server.RegisterUser)
	}
}

func blogGroupRegistration(router *gin.Engine) {
	blogGroup := router.Group("/blogs")
	{
		blogGroup.GET("", server.BlogListHandler)
		blogGroup.GET("/:title", server.ReadHandle)
		blogGroup.GET("/new", server.EditArticle)
		blogGroup.GET("/:title/edit", server.EditArticle)
		blogGroup.POST("/:title/save", server.SaveArticle)
	}
}

func templateFuncRegister(router *gin.Engine) {
	router.SetFuncMap(template.FuncMap{
		"formatTimestamp": func(ts int64) string {
			location, _ := time.LoadLocation("Asia/Shanghai")
			t := time.UnixMilli(ts).In(location)
			return t.Format("2006-01-02 15:04:05")
		},
		"getUserNameById": func(userMap map[int64]string, id int64) string {
			return userMap[id]
		},
	})
}
