const express = require('express');
const employeesRouter = express.Router();
const bodyParser = require('body-parser');
const cors = require('cors');
const errorHandler = require('errorhandler');
const timesheetsRouter = require('./timesheets.js')

employeesRouter.use('/:employeeId/timesheets', timesheetsRouter);

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

employeesRouter.use(bodyParser.json());
employeesRouter.use(cors());

employeesRouter.param('employeeId', (req, res, next, employeeId) => {
  const sql = 'SELECT * FROM Employee WHERE Employee.id = $employeeId';
  const value = {$employeeId: employeeId};
  db.get(sql, value, (err, employee) => {
    if (err) {
      next (err);
    } else if (employee) {
      req.employee = employee;
      next();
    } else {
      res.status(404).send();
    }
  });
});

employeesRouter.get('/', (req, res, next) => {
  db.all('SELECT * FROM Employee WHERE Employee.is_current_employee = 1', (err, employees) => {
    if (err) {
      next (err);
    } else {
       res.status(200).json({employees: employees});
     }
  });
});

employeesRouter.get('/:employeeId', (req, res, next) => {
  res.status(200).json({employee: req.employee});
});

employeesRouter.post('/', (req, res, next) => {
  const newEmployeeName = req.body.employee.name;
  const newEmployeePosition = req.body.employee.position;
  const newEmployeeWage = req.body.employee.wage;
  if (!newEmployeeName || !newEmployeePosition || !newEmployeeWage) {
    return res.status(400).send();
  }
  const isCurrentEmployee = req.body.employee.is_current_employee === 0 ? 0 : 1;
  const sql = 'INSERT INTO Employee (name, position, wage, is_current_employee) VALUES ($name, $position, $wage, $isCurrentEmployee)';
  const value = {
    $name: newEmployeeName,
    $position: newEmployeePosition,
    $wage: newEmployeeWage,
    $isCurrentEmployee: isCurrentEmployee
  };
  db.run(sql, value, function(err) {
    if (err) {
      next (err);
    }
    db.get(`SELECT * FROM Employee WHERE Employee.id = ${this.lastID}`, (err, employee) => {
      res.status(201).json({employee: employee});
    })
  })
});

employeesRouter.put('/:employeeId', (req, res, next) => {
  const updatedEmployeeName = req.body.employee.name;
  const updatedEmployeePosition = req.body.employee.position;
  const updatedEmployeeWage = req.body.employee.wage;
  const isCurrentEmployee = req.body.employee.is_current_employee === 0 ? 0 : 1;
  if (!updatedEmployeeName || !updatedEmployeePosition || !updatedEmployeeWage) {
    return res.status(400).send();
  }
  const sql = 'UPDATE Employee SET name = $name, position = $position, wage = $wage, is_current_employee = $isCurrentEmployee WHERE Employee.id = $employeeId';
  const value = {
    $name: updatedEmployeeName,
    $position: updatedEmployeePosition,
    $wage: updatedEmployeeWage,
    $isCurrentEmployee: isCurrentEmployee,
    $employeeId: req.params.employeeId
  };
  db.run(sql, value, (err) => {
    if (err) {
      next (err);
    } else {
    db.get(`SELECT * FROM Employee WHERE Employee.id = ${req.params.employeeId}`, (err, employee) => {
      res.status(200).json({employee: employee});
    })
    }
  });
});

employeesRouter.delete('/:employeeId', (req, res, next) => {
  const sql = 'UPDATE Employee SET is_current_employee = 0 WHERE Employee.id = $employeeId';
  const value = {
    $employeeId: req.params.employeeId
  };
  db.run(sql, value, (err) => {
    if (err) {
      next (err);
    }
    db.get(`SELECT * FROM Employee WHERE Employee.id = ${req.params.employeeId}`, (err, employee) => {
      res.status(200).json({employee: employee});
    })
  })
});

employeesRouter.use(errorHandler());

module.exports = employeesRouter;
