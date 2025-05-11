import Item from "../Models/Item.js";
import Transaction from "../Models/TransactionModel.js";
import WorkSite from "../Models/WorkSitesModel.js";
import User from "../Models/UserModel.js";

export const GetItems = async (req, res) => {
  try {
    const uniqueItems = await Item.aggregate([
      {
        $group: {
          _id: "$itemName",
          doc: { $first: "$$ROOT" } // get first document for each unique name
        }
      },
      {
        $replaceRoot: { newRoot: "$doc" } // flatten the document
      },
      {
        $sort: { itemName: 1 } // Sort alphabetically by itemName (ascending)
      }
    ]);

    res.status(200).json(uniqueItems);
  } catch (err) {
    res.status(500).json({ message: "Error retrieving unique items", error: err.message });
  }
};
export const GetItemsQuantity = async (req, res) => {
  try {
    const result = await Item.aggregate([
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: "$quantity" }
        }
      }
    ]);

    const totalQuantity = result.length > 0 ? result[0].totalQuantity : 0;

    res.status(200).json({ totalQuantity });
  } catch (err) {
    res.status(500).json({
      message: "Error retrieving total quantity",
      error: err.message,
    });
  }
};
export const GetUniqueItemCount = async (req, res) => {
  try {
    const result = await Item.aggregate([
      {
        $group: {
          _id: "$itemName"
        }
      },
      {
        $count: "uniqueItemCount"
      }
    ]);

    const count = result.length > 0 ? result[0].uniqueItemCount : 0;

    res.status(200).json({ uniqueItemCount: count });
  } catch (err) {
    res.status(500).json({
      message: "Error counting unique items",
      error: err.message,
    });
  }
};
export const AddItem = async (req, res) => {
    try {
        console.log('Request body:', req.body);
        // Add a new item to the database
        const newItem = new Item(req.body);
        const savedItem = await newItem.save();
        res.status(201).json(savedItem);

      try {
          const [workSite, user] = await Promise.all([
            WorkSite.findById(savedItem.workSiteId).lean(),
            User.findById(req.body.userId).lean(),
          ]);
        const workSiteName = workSite?.workSiteName || "Unknown Site";
        const userName = user?.name || "Unknown User";
        
      const transaction = new Transaction({
        itemId: savedItem._id.toString(),
        itemName: savedItem.itemName,
        userId: req.body.userId,
        quantity: savedItem.quantity,
        toSite: savedItem.workSiteId,
        description: `"${savedItem.itemName}" added to "${workSiteName}" by "${userName}"`,
      });

      await transaction.save();
    } catch (txnErr) {
      console.error("Transaction save failed:", txnErr.message);
      res.status(500).json({ message: "Error saving transaction", error: txnErr.message });
    }
    } catch (error) {
        console.error("Error adding item:", error);
        res.status(500).json({ message: "Error adding item", error: error.message });
    }
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
export const EditItem = async (req, res) => {
    const itemId = req.params.id;
    try {
    const updatedItem = await Item.findByIdAndUpdate(itemId, req.body, {
      new: true,
    });

    if (!updatedItem) {
      return res.status(404).json({ message: "Item not found" });
    }
    // Send response immediately
    res.status(200).json(updatedItem);

    // Background transaction creation
    try {
      const [workSite, user] = await Promise.all([
        WorkSite.findById(req.body.worksiteId).lean(),
        User.findById(req.body.userId).lean(),
      ]);

      const workSiteName = workSite?.workSiteName || "Unknown Site";
      const userName = user?.name || "Unknown User";

      const transaction = new Transaction({
        itemId: updatedItem._id.toString(),
        itemName: updatedItem.itemName,
        fromSite: updatedItem.workSiteId,
        userId: req.body.userId,
        quantity: updatedItem.quantity,
        description: `"${updatedItem.itemName}" in the "${workSiteName}" updated by "${userName}" with new quantity: ${updatedItem.quantity} and Item Name: ${updatedItem.itemName}`,
      });

      await transaction.save();
    } catch (txnErr) {
      console.error("Transaction logging failed:", txnErr.message);
    }

  } catch (err) {
    console.error("Error updating item:", err.message);
    res.status(500).json({ message: "Error updating item", error: err.message });
  }
};
export const DeleteItem = async (req, res) => {
  const itemId = req.params.id;

  try {
    const deletedItem = await Item.findByIdAndDelete(itemId);

    if (!deletedItem) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Respond to client immediately
    res.status(200).json({ message: "Item deleted successfully" });

    // Background transaction logging
    try {
      const [workSite, user] = await Promise.all([
        WorkSite.findById(req.body.worksiteId).lean(),
        User.findById(req.body.userId).lean(),
      ]);

      const workSiteName = workSite?.workSiteName || "Unknown Site";
      const userName = user?.name || "Unknown User";

      const transaction = new Transaction({
        itemId: deletedItem._id.toString(),
        fromSite: deletedItem.workSiteId,
        userId: req.body.userId,
        description: `"${deletedItem.itemName}" deleted from "${workSiteName}" by "${userName}"`,
      });

      await transaction.save();
    } catch (txnErr) {
      console.error("Transaction logging failed:", txnErr.message);
    }

  } catch (err) {
    console.error("Error deleting item:", err.message);
    res.status(500).json({ message: "Error deleting item", error: err.message });
  }
};
export const IncreaseQuantity = async (req, res) => {
  const { itemId, quantity, userId } = req.body;

  if (!itemId || !quantity || !userId) {
    return res.status(400).json({ message: "Item ID, quantity, and user ID are required" });
  }

  try {
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    item.quantity += quantity;
    item.lastUpdated = new Date();

    const updatedItem = await item.save();

    // Send response first
    res.status(200).json({
      message: "Quantity increased successfully",
      item: updatedItem
    });

    // Transaction logging in background
    try {
      const [workSite, user] = await Promise.all([
        WorkSite.findById(updatedItem.workSiteId).lean(),
        User.findById(userId).lean(),
      ]);

      const workSiteName = workSite?.workSiteName || "Unknown Site";
      const userName = user?.name || "Unknown User";

      const transaction = new Transaction({
        itemId: updatedItem._id.toString(),
        itemName: updatedItem.itemName,
        userId: userId,
        quantity: quantity,
        fromSite: updatedItem.workSiteId,
        description: `"${quantity}" units added to "${updatedItem.itemName}" at "${workSiteName}" by "${userName}"`,
      });

      await transaction.save();
    } catch (txnErr) {
      console.error("Transaction logging failed:", txnErr.message);
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error increasing quantity", error: err.message });
  }
};
export const IncreaseQuantityByOne = async (req, res) => {
  const { itemId, userId } = req.body;

  if (!itemId || !userId) {
    return res.status(400).json({ message: "Item ID and user ID are required" });
  }

  try {
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    item.quantity += 1;
    item.lastUpdated = new Date();
    const updatedItem = await item.save();

    // Respond to client
    res.status(200).json({
      message: "Quantity increased by one successfully",
      item: updatedItem
    });

    // Background transaction logging
    try {
      const [workSite, user] = await Promise.all([
        WorkSite.findById(updatedItem.workSiteId).lean(),
        User.findById(userId).lean(),
      ]);

      const workSiteName = workSite?.workSiteName || "Unknown Site";
      const userName = user?.name || "Unknown User";

      const transaction = new Transaction({
        itemId: updatedItem._id.toString(),
        itemName: updatedItem.itemName,
        userId: userId,
        quantity: 1,
        toSite: updatedItem.workSiteId,
        description: `1 unit added to "${updatedItem.itemName}" at "${workSiteName}" by "${userName}"`,
      });

      await transaction.save();
    } catch (txnErr) {
      console.error("Transaction logging failed:", txnErr.message);
    }

  } catch (err) {
    console.error("Error increasing quantity by one:", err.message);
    res.status(500).json({ message: "Error increasing quantity by one", error: err.message });
  }
};
export const DecreaseQuantity = async (req, res) => {
  const { itemId, quantity, userId } = req.body;

  if (!itemId || !quantity || !userId) {
    return res.status(400).json({ message: "Item ID, quantity, and user ID are required" });
  }

  try {
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (item.quantity - quantity < 0) {
      return res.status(400).json({ message: "Quantity cannot be less than 0" });
    }

    item.quantity -= quantity;
    item.lastUpdated = new Date();
    const updatedItem = await item.save();

    // Send response to client
    res.status(200).json({
      message: "Quantity decreased successfully",
      item: updatedItem
    });

    // Transaction logging in background
    try {
      const [workSite, user] = await Promise.all([
        WorkSite.findById(updatedItem.workSiteId).lean(),
        User.findById(userId).lean(),
      ]);

      const workSiteName = workSite?.workSiteName || "Unknown Site";
      const userName = user?.name || "Unknown User";

      const transaction = new Transaction({
        itemId: updatedItem._id.toString(),
        itemName: updatedItem.itemName,
        userId: userId,
        quantity: quantity,
        fromSite: updatedItem.workSiteId,
        description: `"${quantity}" units removed from "${updatedItem.itemName}" at "${workSiteName}" by "${userName}"`,
      });

      await transaction.save();
    } catch (txnErr) {
      console.error("Transaction logging failed:", txnErr.message);
    }

  } catch (err) {
    console.error("Error decreasing quantity:", err.message);
    res.status(500).json({ message: "Error decreasing quantity", error: err.message });
  }
};
export const DecreaseQuantityByOne = async (req, res) => {
  const { itemId, userId } = req.body;

  if (!itemId || !userId) {
    return res.status(400).json({ message: "Item ID and user ID are required" });
  }

  try {
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (item.quantity - 1 < 0) {
      return res.status(400).json({ message: "Quantity cannot be less than 0" });
    }

    item.quantity -= 1;
    item.lastUpdated = new Date();
    const updatedItem = await item.save();

    // Send response first
    res.status(200).json({
      message: "Quantity decreased by one successfully",
      item: updatedItem
    });

    // Log transaction in background
    try {
      const [workSite, user] = await Promise.all([
        WorkSite.findById(updatedItem.workSiteId).lean(),
        User.findById(userId).lean(),
      ]);

      const workSiteName = workSite?.workSiteName || "Unknown Site";
      const userName = user?.name || "Unknown User";

      const transaction = new Transaction({
        itemId: updatedItem._id.toString(),
        itemName: updatedItem.itemName,
        userId: userId,
        fromSite: updatedItem.workSiteId,
        description: `1 unit removed from "${updatedItem.itemName}" at "${workSiteName}" by "${userName}"`,
      });

      await transaction.save();
    } catch (txnErr) {
      console.error("Transaction logging failed:", txnErr.message);
    }

  } catch (err) {
    console.error("Error decreasing quantity by one:", err.message);
    res.status(500).json({ message: "Error decreasing quantity by one", error: err.message });
  }
};
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
    const { itemId, from, to, quantity, userId } = req.body;
    if (!itemId || !from || !to || !quantity || !userId) {
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
        image: sourceItem.image,
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

      try {
      const [fromSite, toSiteObj, user] = await Promise.all([
        WorkSite.findById(from).lean(),
        WorkSite.findById(to).lean(),
        User.findById(userId).lean(),
      ]);

      const fromSiteName = fromSite?.workSiteName || "Unknown Site";
      const toSiteName = toSiteObj?.workSiteName || "Unknown Site";
      const userName = user?.name || "Unknown User";

      const transaction = new Transaction({
        itemId: sourceItem._id.toString(),
        itemName: sourceItem.itemName,
        userId: userId,
        quantity: quantity,
        fromSite: from,
        toSite: to,
        description: `${quantity} units of "${sourceItem.itemName}" transferred from ${fromSiteName} to ${toSiteName} by ${userName}`,
      });

      await transaction.save();
    } catch (txnErr) {
      console.error("Transaction logging failed:", txnErr.message);
    }   
    } catch (error) {
        console.error("Error sending item:", error);
        res.status(500).json({ message: "Error sending item", error: error.message });
        
    }
}

