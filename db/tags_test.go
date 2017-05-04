package db

import "testing"

func TestFetchTags(t *testing.T) {
	var _, err = FetchTags()
	if err != nil {
		t.Fatal(err)
	}
}
