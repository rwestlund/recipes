export interface Recipe {
	id: number
	revision: number
	amount: string
	author_id: number
	directions: string[]
	ingredients: string[]
	notes: string
	oven: string
	source: string
	summary: string
	time: string
	title: string
	tags: string[]
	author_name: string
	linked_recipes: LinkedRecipe[]
}

export interface LinkedRecipe {
	id: number
	title: string
}
