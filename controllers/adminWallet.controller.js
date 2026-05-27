import User from "../models/User.js";

export const updateUserBalance = async (req, res) => {
  try {
    const { userId, coin, amount, type, note } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // create coin if not exists
    if (!user.wallet.balances[coin]) {
      user.wallet.balances[coin] = 0;
    }

    // CREDIT
    if (type === "credit") {
      user.wallet.balances[coin] += Number(amount);
    }

    // DEBIT
    if (type === "debit") {
      if (user.wallet.balances[coin] < amount) {
        return res.status(400).json({
          message: "Insufficient balance",
        });
      }

      user.wallet.balances[coin] -= Number(amount);
    }

    // TRANSACTION HISTORY
    user.wallet.transactions.unshift({
      coin,
      type,
      amount,
      note,
    });

    await user.save();

    res.json({
      success: true,
      balances: user.wallet.balances,
      transactions: user.wallet.transactions,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
