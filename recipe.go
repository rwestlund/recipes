package main

type Recipe struct {
    Id          uint32 `json:"id"`
    Revision    uint32 `json:"revision"`
    Amount      string `json:"amount"`
    Author_id   uint32 `json:"author_id"`
    Directions  []string `json:"directions"`
    Ingredients []string `json:"ingredients"`
    Notes       string `json:"notes"`
    Oven        string `json:"oven"`
    Source      string `json:"source"`
    Summary     string `json:"summary"`
    Time        string `json:"time"`
    Title       string `json:"title"`
}

