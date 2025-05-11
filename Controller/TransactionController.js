import Transaction from "./../Models/TransactionModel.js";

export const AddTranaction = async (req, res) => {
    try {
        const { transactionId, itemId, userId, quantity, fromSite, toSite, description } = req.body;
        const newTransaction = new Transaction({
            transactionId,
            itemId,
            userId,
            quantity,
            fromSite,
            toSite,
            description
        });
        await newTransaction.save();
        res.status(201).json({ message: "Transaction added successfully", data: newTransaction });
    } catch (error) {
        res.status(500).json({ message: "Error adding transaction", error: error.message });
    }
};
export const GetAllTransaction = async (req, res) => {
    try {
        const transactions = await Transaction.find();
        res.status(200).json({ message: "Transactions retrieved successfully", data: transactions });
    } catch (error) {
        res.status(500).json({ message: "Error retrieving transactions", error: error.message });
    }
}
export const GetAllTransactionsByFilter = async (req, res) => {
  try {
    const { filter } = req.body;

    const query = {};

    // Optional filters
    if (filter.fromSite) {
      query.fromSite = filter.fromSite;
    }

    if (filter.toSite) {
      query.toSite = filter.toSite;
    }

    if (filter.user) {
      query.userId = filter.user;
    }

    if (filter.item) {
      query.itemName = filter.item;
    }

    if (filter.dateRange && filter.dateRange.length === 2) {
      const [start, end] = filter.dateRange;
      query.createdAt = {
        $gte: new Date(start),
        $lte: new Date(end),
      };
    }

    const transactions = await Transaction.find(query).sort({ createdAt: -1 });
    res.status(200).json({
      message: "Transactions retrieved successfully",
      data: transactions,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving transactions",
      error: error.message,
    });
  }
};

