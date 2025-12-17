const express = require('express');
const db = require('../db');
const router = express.Router();

/**
 * AJUTINE SEED ROUTE
 * Ava brauseris: /random/seed
 * Paneb tabelid + andmed andmebaasi
 */
router.get('/seed', async (req, res) => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS recipe (
        id SERIAL PRIMARY KEY,
        recipename VARCHAR(255) NOT NULL,
        instructions TEXT
      );

      CREATE TABLE IF NOT EXISTS ingredient (
        id SERIAL PRIMARY KEY,
        ingredientname VARCHAR(255) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS ingredientinrecipe (
        id SERIAL PRIMARY KEY,
        recipeid INTEGER REFERENCES recipe(id),
        ingredientid INTEGER REFERENCES ingredient(id)
      );
    `);

    await db.query(`
      INSERT INTO recipe (recipename, instructions) VALUES
      ('Pumpkin Pasties', 'Mix pumpkin puree, sugar, and spices.'),
      ('Pumpkin Tartlets', 'Mix pumpkin puree and brown sugar.'),
      ('Creamy Pumpkin Soup', 'Sauté onion and garlic, add pumpkin.')
      ON CONFLICT DO NOTHING;
    `);

    await db.query(`
      INSERT INTO ingredient (ingredientname) VALUES
      ('pumpkin puree'),('sugar'),('cinnamon'),('nutmeg'),('cloves'),
      ('pastry dough'),('egg wash'),('brown sugar'),('ginger'),
      ('onion'),('garlic')
      ON CONFLICT DO NOTHING;
    `);

    await db.query(`
      INSERT INTO ingredientinrecipe (recipeid, ingredientid) VALUES
      (1,1),(1,2),(1,3),(1,4),(1,5),(1,6),(1,7),
      (2,1),(2,8),(2,9),(2,3),(2,4),
      (3,1),(3,10),(3,11)
      ON CONFLICT DO NOTHING;
    `);

    res.json({ ok: true, message: 'Database seeded' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PÄRIS RANDOM ROUTE
 * Õppejõud kontrollib seda
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
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
