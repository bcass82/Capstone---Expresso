const express = require('express');
const timesheetsRouter = express.Router({mergeParams: true});
const bodyParser = require('body-parser');
const cors = require('cors');
const errorHandler = require('errorhandler');

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

timesheetsRouter.use(bodyParser.json());
timesheetsRouter.use(cors());

timesheetsRouter.param('timesheetId', (req, res, next, timesheetId) => {
  const sql = 'SELECT * FROM Timesheet WHERE Timesheet.id = $timesheetId';
  const value = {$timesheetId: timesheetId};
  db.get(sql, value, (err, timesheet) => {
    if (err) {
      next (err);
    } else if (timesheet) {
      req.timesheet = timesheet;
      next();
    } else {
      res.status(404).send();
    }
  });
});

timesheetsRouter.get('/', (req, res, next) => {
  const sql = 'SELECT * FROM Timesheet WHERE Timesheet.employee_id = $employeeId';
  const value = {$employeeId: req.params.employeeId};
  db.all(sql, value, (err, timesheets) => {
    if (err) {
      next (err);
    } else {
       res.status(200).json({timesheets: timesheets});
     }
  });
});

timesheetsRouter.post('/', (req, res, next) => {
  const newTimesheet = req.body.timesheet;
  const findEmployee = 'SELECT * FROM Employee WHERE Employee.id = $employeeId';
  const findValue = {$employeeId: req.params.employeeId};
  db.all(findEmployee, findValue, (err, employee) => {
    if (!employee) {
      return res.status(404).send();
    } else if (!newTimesheet.hours || !newTimesheet.rate || !newTimesheet.date || !employee) {
      return res.status(400).send();
    } else {
      const sql = 'INSERT INTO Timesheet (hours, rate, date, employee_id) VALUES ($hours, $rate, $date, $employeeId)';
      const value = {
        $hours: newTimesheet.hours,
        $rate: newTimesheet.rate,
        $date: newTimesheet.date,
        $employeeId: req.params.employeeId
      };
      db.run(sql, value, function(err) {
        if (err) {
          next (err);
        }
        db.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${this.lastID}`, (err, timesheet) => {
          res.status(201).json({timesheet: timesheet});
        })
    })
  }
})
});

timesheetsRouter.put('/:timesheetId', (req, res, next) => {
  const hours = req.body.timesheet.hours,
        rate = req.body.timesheet.rate,
        date = req.body.timesheet.date,
        employeeId = req.params.employeeId;
  const employeeSql = 'SELECT * FROM Employee WHERE Employee.id = $employeeId';
  const employeeValues = {$employeeId: employeeId};
  if (!hours|| !rate || !date || !employeeId) {
    return res.sendStatus(400);
  }
      const sql = 'UPDATE Timesheet SET hours = $hours, rate = $rate, date = $date WHERE Timesheet.id = $timesheetId';
      const values = {
        $hours: hours,
        $rate: rate,
        $date: date,
        $timesheetId: req.params.timesheetId
      };

      db.run(sql, values, function(error) {
        if (error) {
          next(error);
        } else {
          db.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${req.params.timesheetId}`,
            (error, timesheet) => {
              res.status(200).json({timesheet: timesheet});
            });
        }
      });
});

timesheetsRouter.delete('/:timesheetId', (req, res, next) => {
  const sql = 'DELETE FROM Timesheet WHERE Timesheet.id = $timesheetId';
  const value = {
    $timesheetId: req.params.timesheetId
  };
  db.run(sql, value, (err) => {
    if (err) {
      next (err);
    }
      res.status(204).send();
    })
});

timesheetsRouter.use(errorHandler());

module.exports = timesheetsRouter;
