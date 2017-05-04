package db

import (
	"os"
	"testing"
)

func TestMain(m *testing.M) {
	Init("recipes", "recipes")
	os.Exit(m.Run())
}
