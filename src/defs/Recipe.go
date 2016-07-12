package defs
/* This defines the Recipe struct, which represents a recipe from the DB */

type Recipe struct {
    Id              uint32          `json:"id"`
    Revision        uint32          `json:"revision"`
    Amount          string          `json:"amount"`
    AuthorId        uint32          `json:"author_id"`
    Directions      []string        `json:"directions"`
    Ingredients     []string        `json:"ingredients"`
    Notes           string          `json:"notes"`
    Oven            string          `json:"oven"`
    Source          string          `json:"source"`
    Summary         string          `json:"summary"`
    Time            string          `json:"time"`
    Title           string          `json:"title"`
    /* Fields from other tables. */
    Tags            []string        `json:"tags"`
    AuthorName      string          `json:"author_name"`
    LinkedRecipes   []LinkedRecipe  `json:"linked_recipes"`
}

type LinkedRecipe struct {
    Id              uint32          `json:"id"`
    Title           string          `json:"title"`
}
