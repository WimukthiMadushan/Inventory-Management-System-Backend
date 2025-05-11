import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
    itemName: {
        type: String,
        required: true,
        unique: true,
    },
    workSiteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WorkSite',
        default: null,
    },
    quantity: {
        type: Number,
        required: true,
    },
    lastUpdated: {
        type: Date,
        default: Date.now,
    },
    image: {
        type: String,
        required: false,
        default: null,
    },
}, { timestamps: true });

const Item = mongoose.model("Item", itemSchema);
export default Item;
