import mongoose from 'mongoose';

const workSitesSchema = new mongoose.Schema({
  workSiteName: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  workSiteManager: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const WorkSite = mongoose.model('WorkSite', workSitesSchema);

export default WorkSite;
