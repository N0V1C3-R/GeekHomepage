package model

type UserRole string

const (
	SuperAdmin UserRole = "SUPER_ADMIN"
	Admin      UserRole = "ADMIN"
	Client     UserRole = "USER"
)
