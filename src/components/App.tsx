import { FC, useState, useEffect } from 'react';
import { useFetch } from '../lib/hooks';
import { RecipeCard } from './RecipeCard';
import { Recipe } from '../types/Recipe';
import './App.scss';

export const App: FC = () => {

  const [ recipes, loadingRecipies ] = useFetch<Recipe[]>('/api/recipes')

  return (
    <div>
      <h1>Recipes</h1>
      <div id="main-content">
        {loadingRecipies
          ? <div>Loading...</div>
          : recipes?.map(r => <RecipeCard key={r.id} recipe={r} />)
        }
      </div>
    </div>
  );
};
