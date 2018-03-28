const express = require('express');
const menuItemsRouter = express.Router({mergeParams: true});
const bodyParser = require('body-parser');
const cors = require('cors');
const errorHandler = require('errorhandler');

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

menuItemsRouter.use(bodyParser.json());
menuItemsRouter.use(cors());

menuItemsRouter.param('menuItemId', (req, res, next, menuItemId) => {
  const sql = 'SELECT * FROM MenuItem WHERE MenuItem.id = $menuItemId';
  const value = {$menuItemId: menuItemId};
  db.get(sql, value, (err, menuItem) => {
    if (err) {
      next (err);
    } else if (menuItem) {
      req.menuItem = menuItem;
      next();
    } else {
      res.status(404).send();
    }
  });
});

menuItemsRouter.get('/', (req, res, next) => {
  const sql = 'SELECT * FROM MenuItem WHERE MenuItem.menu_id = $menuId';
  const value = {$menuId: req.params.menuId};
  db.all(sql, value, (err, menuItems) => {
    if (err) {
      next (err);
    } else {
       res.status(200).json({menuItems: menuItems});
     }
  });
});

menuItemsRouter.post('/', (req, res, next) => {
  const newMenuItem = req.body.menuItem;
  const findMenu = 'SELECT * FROM Menu WHERE Menu.id = $menuId';
  const findValue = {$menuId: req.params.menuId};
  db.all(findMenu, findValue, (err, menu) => {
    if (!menu) {
      return res.status(404).send();
    } else if (!newMenuItem.name || !newMenuItem.inventory || !newMenuItem.price || !req.params.menuId) {
      return res.status(400).send();
    } else {
      const sql = 'INSERT INTO MenuItem (name, description, inventory, price, menu_id) VALUES ($name, $description, $inventory, $price, $menuId)';
      const value = {
        $name: newMenuItem.name,
        $description: newMenuItem.description,
        $inventory: newMenuItem.inventory,
        $price: newMenuItem.price,
        $menuId: req.params.menuId
      };
      db.run(sql, value, function(err) {
        if (err) {
          next (err);
        }
        db.get(`SELECT * FROM MenuItem WHERE MenuItem.id = ${this.lastID}`, (err, menuItem) => {
          res.status(201).json({menuItem: menuItem});
        })
    })
  }
})
});

menuItemsRouter.put('/:menuItemId', (req, res, next) => {
  const updatedMenuItem = req.body.menuItem;
  const findMenu = 'SELECT * FROM Menu WHERE Menu.id = $menuId';
  const findValue = {$menuId: req.params.menuId};
  if (!updatedMenuItem.name || !updatedMenuItem.inventory || !updatedMenuItem.price || !req.params.menuId) {
      return res.status(400).send();
    }
    const sql = 'UPDATE MenuItem SET name = $name, description = $description, inventory = $inventory, price = $price, menu_id = $menuId WHERE MenuItem.id = $menuItemId';
    const value = {
      $name: updatedMenuItem.name,
      $description: updatedMenuItem.description,
      $inventory: updatedMenuItem.inventory,
      $price: updatedMenuItem.price,
      $menuId: req.params.menuId,
      $menuItemId: req.params.menuItemId
    };
    db.run(sql, value, function(err) {
      if (err) {
        next (err);
      } else {
        db.get(`SELECT * FROM MenuItem WHERE MenuItem.id = ${req.params.menuItemId}`, (err, menuItem) => {
          res.status(200).json({menuItem: menuItem});
        })
      }
    });
});

menuItemsRouter.delete('/:menuItemId', (req, res, next) => {
  const findMenu = 'SELECT * FROM Menu WHERE Menu.id = $menuId';
  const menuValue = {$menuId: req.params.menuId};
  db.all(findMenu, menuValue, (err, menu) => {
    if (!menu) {
      return res.status(404).send();
    }
    const sql = 'DELETE FROM MenuItem WHERE MenuItem.id = $menuItemId';
    const value = {
      $menuItemId: req.params.menuItemId
    };
    db.run(sql, value, (err) => {
      if (err) {
        next (err);
      }
        res.status(204).send();
    })
  });
});

menuItemsRouter.use(errorHandler());

module.exports = menuItemsRouter;
