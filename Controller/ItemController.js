import Item from "../Models/Item.js";

export const GetItems = (req, res) => { 
    // Get all items from the database
    Item.find()
        .then(items => {
            res.status(200).json(items);
        })
        .catch(err => {
            res.status(500).json({ message: "Error retrieving items", error: err });
        });

}
export const AddItem = (req, res) => {
    console.log('Request body:', req.body); 
    // Add a new item to the database
    const newItem = new Item(req.body);
    newItem.save()
        .then(item => {
            res.status(201).json(item);
        })
        .catch(err => {
            res.status(500).json({ message: "Error adding item", error: err });
        });

}
export const GetItemsBySiteId = (req, res) => { 
    // Get items by worksite ID from the database
    const workSiteId = req.params.id;
    console.log('Worksite ID:', workSiteId);
    if (!workSiteId) {
        return res.status(400).json({ message: "Worksite ID is required" });
    }
    Item.find({ workSiteId })
        .then(items => {
            res.status(200).json(items);
        })
        .catch(err => {
            res.status(500).json({ message: "Error retrieving items", error: err });
        });
}

export const GetItemsByName = async (req, res) => {
    // Get items by name from the database
    const { name } = req.query;
    console.log('Name query parameter:', name);
    if (!name) {
        return res.status(400).json({ message: "Name query parameter is required" });
    }
    try {
        const items = await Item.find({
            itemName: { $regex: name, $options: "i" }
        });
        res.status(200).json(items);
    } catch (error) {
        console.error("Error fetching items by name:", error);
        res.status(500).json({ message: "Error fetching items", error: error.message });
    }
};

export const EditItem = (req, res) => {
    // Edit an item in the database
    const itemId = req.params.id;
    Item.findByIdAndUpdate
        (itemId, req.body, { new: true })
        .then(item => {
            if (!item) {
                return res.status(404).json({ message: "Item not found" });
            }
            res.status(200).json(item);
        })
        .catch(err => {
            res.status(500).json({ message: "Error updating item", error: err });
        });   
}

export const DeleteItem = (req, res) => { 
    // Delete an item from the database
    const itemId = req.params.id;
    Item.findByIdAndDelete(itemId)
        .then(() => {
            res.status(200).json({ message: "Item deleted successfully" });
        })
        .catch(err => {
            res.status(500).json({ message: "Error deleting item", error: err });
        });
}

export const IncreaseQuantity = async (req, res) => {
    // Increase the quantity of an item in the database
    const { itemId, quantity } = req.body;
    if (!itemId || !quantity) {
        return res.status(400).json({ message: "Item ID and quantity are required" });
    }
    try {
        const item = await Item.findById(itemId);
        if (!item) {
            return res.status(404).json({ message: "Item not found" });
        }

        item.quantity += quantity;
        item.lastUpdated = new Date();

        const updatedItem = await item.save();

        res.status(200).json({
            message: "Quantity increased successfully",
            item: updatedItem
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error increasing quantity", error: err });
    }
}

export const IncreaseQuantityByOne = (req, res) => { 
    // Increase the quantity of an item by one in the database
    const { itemId } = req.body;
    if (!itemId) {
        return res.status(400).json({ message: "Item ID is required" });
    }
    Item.findById(itemId)
        .then(item => {
            if (!item) {
                return res.status(404).json({ message: "Item not found" });
            }
            item.quantity += 1;
            item.lastUpdated = new Date();
            return item.save();
        })
        .then(updatedItem => {
            res.status(200).json({
                message: "Quantity increased by one successfully",
                item: updatedItem
            });
        })
        .catch(err => {
            res.status(500).json({ message: "Error increasing quantity", error: err });
        });
}
export const DecreaseQuantity = (req, res) => {
    // Decrease the quantity of an item in the database
    const { itemId, quantity } = req.body;
    if (!itemId || !quantity) {
        return res.status(400).json({ message: "Item ID and quantity are required" });
    }
    Item.findById(itemId)
        .then(item => {
            if (!item) {
                return res.status(404).json({ message: "Item not found" });
            }
            if (item.quantity - quantity < 0) {
                return res.status(400).json({ message: "Quantity cannot be less than 0" });
            }
            item.quantity -= quantity;
            item.lastUpdated = new Date();
            return item.save();
        })
        .then(updatedItem => {
            res.status(200).json({
                message: "Quantity decreased successfully",
                item: updatedItem
            });
        })
        .catch(err => {
            res.status(500).json({ message: "Error decreasing quantity", error: err });
        });
 }
export const DecreaseQuantityByOne = (req, res) => { 
    // Decrease the quantity of an item by one in the database
    const { itemId } = req.body;
    if (!itemId) {
        return res.status(400).json({ message: "Item ID is required" });
    }
    Item.findById(itemId)
        .then(item => {
            if (!item) {
                return res.status(404).json({ message: "Item not found" });
            }
            if (item.quantity - 1 < 0) {
                return res.status(400).json({ message: "Quantity cannot be less than 0" });
            }

            item.quantity -= 1;
            item.lastUpdated = new Date();
            return item.save();
        })
        .then(updatedItem => {
            res.status(200).json({
                message: "Quantity decreased by one successfully",
                item: updatedItem
            });
        })
        .catch(err => {
            res.status(500).json({ message: "Error decreasing quantity", error: err });
        });
}

export const GetItemsPagination = async (req, res) => {
    let { page = 1, limit = 10, worksiteId, search = "" } = req.query;

  page = parseInt(page);
  limit = parseInt(limit);
  const skip = (page - 1) * limit;

  try {
    const query = {};

    // Add worksite filter if provided
    if (worksiteId) {
      query.workSiteId = worksiteId;
    }

    // Add search filter (case-insensitive, partial match)
    if (search.trim() !== "") {
      query.itemName = { $regex: search, $options: "i" };
    }

    const items = await Item.find(query).skip(skip).limit(limit);
    const totalItems = await Item.countDocuments(query);

    res.status(200).json({
      items,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: page
    });
  } catch (error) {
    console.error("Error fetching items with pagination:", error);
    res.status(500).json({ message: "Error fetching items", error: error.message });
  }
};


export const SendItem = async (req, res) => { 
    try {
    const { itemId, from, to, quantity } = req.body;
    if (!itemId || !from || !to || !quantity) {
        return res.status(400).json({ message: "Missing required fields" });
        }
        if (from === to) {
      return res.status(400).json({ message: "Source and destination cannot be the same" });
        }
        const sourceItem = await Item.findOne({ _id: itemId, workSiteId: from });
    if (!sourceItem || sourceItem.quantity < quantity) {
      return res.status(400).json({ message: "Insufficient quantity at source" });
        }
        sourceItem.quantity -= quantity;
        await sourceItem.save();

        let destItem = await Item.findOne({ itemName: sourceItem.itemName, workSiteId: to });
         if (destItem) {
      // Increase quantity if it exists
      destItem.quantity += quantity;
      await destItem.save();
    } else {
      // Create a new item record at destination
      destItem = new Item({
        itemName: sourceItem.itemName,
        quantity: quantity,
        workSiteId: to,
        lastUpdated: new Date(),
      });
      await destItem.save();
        }
        
        res.status(200).json({
      message: "Item transferred successfully",
      from: sourceItem,
      to: destItem,
        });
        
        
        
        
    } catch (error) {
        console.error("Error sending item:", error);
        res.status(500).json({ message: "Error sending item", error: error.message });
        
    }

}

