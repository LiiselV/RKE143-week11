const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const recipeQuery = 'SELECT id, recipeName, instructions FROM recipe ORDER BY RANDOM() LIMIT 1;';
    const recipeResult = await db.query(recipeQuery);

    if (recipeResult.rows.length === 0) {
      return res.status(404).json({ errorMessage: 'No recipes found.' });
    }

    const selectedRecipe = recipeResult.rows[0];

    const ingredientsQuery = `
      SELECT b.ingredientName AS "ingredientName"
      FROM ingredient b
      INNER JOIN ingredientinrecipe c ON b.id = c.ingredientId
      WHERE c.recipeId = $1;
    `;

    const ingredientsResult = await db.query(ingredientsQuery, [selectedRecipe.id]);
    const ingredients = ingredientsResult.rows.map((el) => el.ingredientName);

    const randomRecipe = {
      recipe: selectedRecipe,
      ingredients: ingredients
    };

    res.json(randomRecipe);
  } catch (error) {
    console.log(error);
    res.status(500).json({ errorMess