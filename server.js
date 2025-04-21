import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

const PORT = process.env.PORT || 3000;

const app = express();
dotenv.config();
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});


mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
    .catch(err => console.error(err));
  
    
