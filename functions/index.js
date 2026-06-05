const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const { setGlobalOptions } = require("firebase-functions");

// Load the local .env file containing the STRIPE_SECRET_KEY
require("dotenv").config();

// Initialize Stripe with the loaded secret key
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

setGlobalOptions({ maxInstances: 10 });

// HTTP endpoint to create a PaymentIntent
exports.createPaymentIntent = onRequest({ cors: true }, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      res.status(400).json({ error: "Invalid amount" });
      return;
    }

    // Create a PaymentIntent with the specified amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // convert to cents (e.g. 29.99 -> 2999)
      currency: "usd",
      metadata: { integration_check: "accept_a_payment" },
    });

    // Send the clientSecret to the frontend
    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    logger.error("Error creating PaymentIntent:", error);
    res.status(500).json({ error: error.message });
  }
});
