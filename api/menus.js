const express = require('express');
const menusRouter = express.Router();
const bodyParser = require('body-parser');
const cors = require('cors');
const errorHandler = require('errorhandler');
const menuItemsRouter = require('./menu-items.js');

menusRouter.use('/:menuId/menu-items', menuItemsRouter)

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

menusRouter.use(bodyParser.json());
menusRouter.use(cors());

menusRouter.param('menuId', (req, res, next, menuId) => {
  const sql = 'SELECT * FROM Menu WHERE Menu.id = $menuId';
  const value = {$menuId: menuId};
  db.get(sql, value, (err, menu) => {
    if (err) {
      next (err);
    } else if (menu) {
      req.menu = menu;
      next();
    } else {
      res.status(404).send();
    }
  });
});

menusRouter.get('/', (req, res, next) => {
  db.all('SELECT * FROM Menu', (err, menus) => {
    if (err) {
      next (err);
    } else {
       res.status(200).json({menus: menus});
     }
  });
});

menusRouter.get('/:menuId', (req, res, next) => {
  res.status(200).json({menu: req.menu});
});

menusRouter.post('/', (req, res, next) => {
  const newMenuTitle = req.body.menu.title;
  if (!newMenuTitle) {
    return res.status(400).send();
  }
  const sql = 'INSERT INTO Menu (title) VALUES ($title)';
  const value = {
    $title: newMenuTitle
  };
  db.run(sql, value, function(err) {
    if (err) {
      next (err);
    }
    db.get(`SELECT * FROM Menu WHERE Menu.id = ${this.lastID}`, (err, menu) => {
      res.status(201).json({menu: menu});
    })
  })
});

menusRouter.put('/:menuId', (req, res, next) => {
  const updatedMenu = req.body.menu;
  const findMenu = 'SELECT * FROM Menu WHERE Menu.id = $menuId';
  const findValue = {$menuId: req.params.menuId};
  if (!updatedMenu.title) {
    return res.status(400).send();
  }
  db.all(findMenu, findValue, (err, menu) => {
    if (!menu) {
      return res.status(404).send();
    }
    const sql = 'UPDATE Menu SET title = $title WHERE Menu.id = $menuId';
    const value = {
      $title: updatedMenu.title,
      $menuId: req.params.menuId
    };
    db.run(sql, value, (err) => {
      if (err) {
        next (err);
      } else {
        db.get(`SELECT * FROM Menu WHERE Menu.id = ${req.params.menuId}`, (err, menu) => {
          res.status(200).json({menu: menu});
        })
      }
    });
  });
});

menusRouter.delete('/:menuId', (req, res, next) => {
  const findMenuItem = 'SELECT * FROM MenuItem WHERE MenuItem.menu_id = $menuId';
  const menuItemValue = {$menuId: req.params.menuId};
  db.get(findMenuItem, menuItemValue, (err, menuItem) => {
    if (err) {
      next (err);
    } else if (menuItem) {
        res.status(400).send();
    } else {
      const sql = 'DELETE FROM Menu WHERE Menu.id = $menuId';
      const value = {$menuId: req.params.menuId};
      db.run(sql, value, (err) => {
        if (err) {
          next (err);
        } else {
          res.status(204).send();
        }
      })
    }
  });
});

menusRouter.use(errorHandler());

module.exports = menusRouter;
