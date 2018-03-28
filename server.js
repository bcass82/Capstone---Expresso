const express = require('express');
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cors = require('cors');
const errorHandler = require('errorhandler');

const PORT = process.env.PORT || 4000;

const apiRouter = require('./api/api')
app.use('/api', apiRouter);

/*if (!process.env.IS_TEST_ENV) {
  app.use(morgan('short'));
}*/

app.use(bodyParser.json());
app.use(cors());

app.use(errorHandler());

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

module.exports = app;
