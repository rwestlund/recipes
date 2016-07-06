package defs
/* This defines the ItemFilter struct, which represents a search query for any
 * records in a collection that match the query string. It expects server-side
 * pagination.
 */

type ItemFilter struct {
    /* Use SQL ILIKE to filter title by this, with % on both ends. */
    Query       string
    /* Limit to this many results. */
    Count       uint32
    /* Skip this many pages of results. */
    Skip        uint32
}

