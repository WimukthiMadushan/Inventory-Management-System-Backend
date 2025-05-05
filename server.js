import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ItemRoutes from './Routes/ItemRoutes.js';
import AuthRoutes from './Routes/AuthRoutes.js';
import WorkSitesRoutes from './Routes/WorkSitesRoute.js';
import cors from 'cors';

const PORT = process.env.PORT || 3000;

const app = express();
dotenv.config();
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.use("/Items", ItemRoutes);
app.use("/User", AuthRoutes);
app.use("/WorkSite", WorkSitesRoutes);


mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
    .catch(err => console.error(err));
  
    
