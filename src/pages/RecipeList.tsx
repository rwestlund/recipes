import { FC, useState, useEffect } from 'react';
import { useEffectDebounced } from '../lib/hooks';
import { fetchData, } from '../lib/util';
import { RecipeCard } from '../components/RecipeCard';
import { Recipe } from '../types/Recipe';

export const RecipeList: FC = () => {

  const [ query, setQuery ] = useState('')
  const [ recipes, setRecipes ] = useState<Recipe[]>([])
  const [ loading, setLoading ] = useState<boolean>(false)
  useEffectDebounced(() => {
    setLoading(true)
    fetchData<Recipe[]>('/api/recipes', { query }).then(setRecipes).finally(() => setLoading(false))
  }, 250, [query])

  return (
    <div>
      <h1>All Recipes</h1>
      <div id="main-content">
        <input value={query} onChange={e => setQuery(e.target.value)}></input>
        {loading
          ? <div>Loading...</div>
          : recipes.length > 0
            ? recipes.map(r => <RecipeCard key={r.id} recipe={r} />)
            : <div>No results!</div>
        }
      </div>
    </div>
  );
};
