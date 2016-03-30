package defs

type Recipe struct {
    Id          uint32      `json:"id"`
    Revision    uint32      `json:"revision"`
    Amount      string      `json:"amount"`
    AuthorId    uint32      `json:"author_id"`
    Directions  []string    `json:"directions"`
    Ingredients []string    `json:"ingredients"`
    Notes       string      `json:"notes"`
    Oven        string      `json:"oven"`
    Source      string      `json:"source"`
    Summary     string      `json:"summary"`
    Time        string      `json:"time"`
    Title       string      `json:"title"`
    /* Fields from other tables. */
    Tags        []string    `json:"tags"`
    AuthorName  string      `json:"author_name"`
}

type RecipeFilter struct {
    /* Use SQL ILIKE to filter title by this, with % on both ends. */
    Title       string
    /* Limit to this many results. */
    Count       uint32
    /* Skip this many pages of results. */
    Skip        uint32
}

