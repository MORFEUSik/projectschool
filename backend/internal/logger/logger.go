package logger

import (
	"github.com/sirupsen/logrus"
)

var Log *logrus.Logger

func Init() {
	if Log == nil {
		Log = logrus.New()
		Log.SetFormatter(&logrus.JSONFormatter{})
	}
}
