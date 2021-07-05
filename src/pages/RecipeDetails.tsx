import { FC, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useFetch } from '../lib/hooks';
import { RecipeCard } from '../components/RecipeCard';
import { Recipe } from '../types/Recipe';

export const RecipeDetails: FC = () => {

  const { id } = useParams()
  const [ recipe, loadingRecipie ] = useFetch<Recipe>(`/api/recipes/${id}`)

  return (
    <div>
      {loadingRecipie
        ? <div>Loading...</div>
        : <RecipeCard recipe={recipe} />
      }
    </div>
  );
};
