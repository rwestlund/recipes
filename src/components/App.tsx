import { FC, useState, useEffect } from 'react';
import { BrowserRouter, Switch, Route } from 'react-router-dom';
import { RecipeList } from '../pages/RecipeList';
import { RecipeDetails } from '../pages/RecipeDetails';
import './App.scss';

export const App: FC = () => {

  return (
    <div>
      <h1>Recipes</h1>
      <div id="main-content">
        <BrowserRouter>
          <Switch>
            <Route exact path="/" component={RecipeList} />
            <Route path="/recipes/:id" component={RecipeDetails} />
          </Switch>
        </BrowserRouter>
      </div>
    </div>
  );
};
