import { FC, useState } from 'react';
import { Link } from 'react-router-dom';
import { Recipe, LinkedRecipe } from '../types/Recipe';

type RecipeCardProps = {
  recipe: Recipe
}
export const RecipeCard: FC<RecipeCardProps> = ({ recipe }) => {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="title">{recipe.title}</h3>
        <span className="muted">{recipe.tags.join(', ')}</span>
      </div>
      <div>{recipe.summary}</div>

      <h4>Ingredients</h4>
      <ul>
        {recipe.ingredients.map((i, index) => <li key={index}>{i}</li>)}
      </ul>

      <h4>Directions</h4>
      <ol>
        {recipe.directions.map((d, index) => <li key={index}>{d}</li>)}
      </ol>

      <table>
        <tbody>
          {recipe.amount ? <tr><td>Amount</td><td>{recipe.amount}</td></tr> : null}
          {recipe.time ? <tr><td>Time</td><td>{recipe.time}</td></tr>: null}
          {recipe.oven ? <tr><td>Oven</td><td>{recipe.oven}</td></tr>: null}
          {recipe.author_name ? <tr><td>Author</td><td>{recipe.author_name}</td></tr>: null}
          {recipe.notes ? <tr><td>Notes</td><td>{recipe.notes}</td></tr>: null}
          {recipe.linked_recipes.length > 0
            ? <tr>
                <td>Linked Recipes</td>
                <td>{recipe.linked_recipes.map((r,i,o) =>
                  <LinkedRecipeLink key={r.id} recipe={r} showComma={i+1 !== o.length} />)}</td>
              </tr>
            : null
          }
        </tbody>
      </table>
    </div>
  )
}

type LinkedRecipeLinkProps = {
  recipe: LinkedRecipe
  showComma: boolean
}
const LinkedRecipeLink: FC<LinkedRecipeLinkProps> = ({ recipe, showComma }) => {
  return <>
    <Link to={`/recipes/${recipe.id}`}>{recipe.title}</Link>
    {showComma && <span style={{marginRight: '8px'}}>,</span>}
  </>
}
