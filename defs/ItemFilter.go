/*
 * Copyright (c) 2016, Randy Westlund. All rights reserved.
 * This code is under the BSD-2-Clause license.
 *
 * This defines the ItemFilter struct, which represents a search query for any
 * records in a collection that match the query string. It expects server-side
 * pagination.
 */

package defs

type ItemFilter struct {
	/* Use SQL ILIKE to filter title by this, with % on both ends. */
	Query string
	/* Limit to this many results. */
	Count uint32
	/* Skip this many pages of results. */
	Skip uint32
}
