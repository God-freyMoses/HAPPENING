const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Birthday Event Planning API' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});