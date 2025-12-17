const express = require('express');
const db = require('../db');
const router = express.Router();

/**
 * ÜHEKORDNE SEED:
 * Ava /random/seed -> teeb tabelid + lisab andmed (resetib kui vaja)
 */
router.get('/seed', async (req, res) => {
  try {
    // reset (lihtne ja kindel, et ei tekiks conflict/duplikaate)
    await db.query(`DROP TABLE IF EXISTS ingredientinrecipe;`);
    await db.query(`DROP TABLE IF EXISTS ingredient;`);
    await db.query(`DROP TABLE IF EXISTS recipe;`);

    await db.query(`
      CREATE TABLE recipe (
        id SERIAL PRIMARY KEY,
        recipename VARCHAR(255) NOT NULL,
        instructions TEXT
      );

      CREATE TABLE ingredient (
        id SERIAL PRIMARY KEY,
        ingredientname VARCHAR(255) NOT NULL
      );

      CREATE TABLE ingredientinrecipe (
        id SERIAL PRIMARY KEY,
        recipeid INTEGER NOT NULL REFERENCES recipe(id) ON DELETE CASCADE,
        ingredientid INTEGER NOT NULL REFERENCES ingredient(id) ON DELETE CASCADE
      );
    `);

    await db.query(`
      INSERT INTO recipe (recipename, instructions) VALUES
      ('Pumpkin Pasties', 'Mix pumpkin puree, sugar, and spices.'),
      ('Pumpkin Tartlets', 'Mix pumpkin puree and brown sugar.'),
      ('Creamy Pumpkin Soup', 'Sauté onion and garlic, add pumpkin.');
    `);

    await db.query(`
      INSERT INTO ingredient (ingredientname) VALUES
      ('pumpkin puree'),
      ('sugar'),
      ('cinnamon'),
      ('nutmeg'),
      ('cloves'),
      ('pastry dough'),
      ('egg wash'),
      ('brown sugar'),
      ('ginger'),
      ('onion'),
      ('garlic');
    `);

    await db.query(`
      INSERT INTO ingredientinrecipe (recipeid, ingredientid) VALUES
      (1,1),(1,2),(1,3),(1,4),(1,5),(1,6),(1,7),
      (2,1),(2,8),(2,9),(2,3),(2,4),
      (3,1),(3,10),(3,11);
    `);

    res.json({ ok: true, message: 'Database seeded (tables + data created)' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

/**
 * ÕPPEJÕU KONTROLL: /random
 */
router.get('/', async (req, res) => {
  try {
    const recipeResult = await db.query(
      'SELECT id, recipename, instructions FROM recipe ORDER BY RANDOM() LIMIT 1;'
    );

    if (recipeResult.rows.length === 0) {
      return res.status(404).json({ error: 'No recipes found' });
    }

    const recipe = recipeResult.rows[0];

    const ingredientsResult = await db.query(
      `SELECT i.ingredientname
       FROM ingredient i
       JOIN ingredientinrecipe ir ON ir.ingredientid = i.id
       WHERE ir.recipeid = $1`,
      [recipe.id]
    );

    res.json({
      recipe,
      ingredients: ingredientsResult.rows.map(r => r.ingredientname)
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

module.exports = router;
