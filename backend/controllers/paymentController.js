const Razorpay = require('razorpay');
const crypto = require('crypto');
const sendEmail = require('../utils/emailService');

const sendNotificationEmail = async (options) => {
  try {
    await sendEmail(options);
  } catch (error) {
    console.error('Email notification failed:', error.message);
  }
};

// Initialize Razorpay instance
const getRazorpayInstance = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

// @desc    Create Razorpay Order
// @route   POST /api/payment/create-order
// @access  Private
const createOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount) {
      return res.status(400).json({ message: 'Amount is required' });
    }

    const razorpay = getRazorpayInstance();
    const options = {
      amount: amount * 100, // amount in the smallest currency unit (paise)
      currency: "INR",
      receipt: `receipt_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);
    
    if (!order) {
      return res.status(500).json({ message: 'Some error occurred while creating order' });
    }

    res.json(order);
  } catch (error) {
    console.error("Razorpay Create Order Error:", error);
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Verify Razorpay Payment
// @route   POST /api/payment/verify
// @access  Private
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      // Payment is successful
      try {
        const razorpay = getRazorpayInstance();
        const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
        const amount = paymentDetails.amount ? (paymentDetails.amount / 100).toFixed(2) : 'N/A';
        
        sendNotificationEmail({
          email: req.user.email,
          subject: 'Payment Verification Successful - DentaAI',
          message: `Hello ${req.user.name},\n\nYour payment has been successfully verified.\n\nAmount: INR ${amount}\nPayment ID: ${razorpay_payment_id}\nOrder ID: ${razorpay_order_id}\n\nRegards,\nDentaAI Team`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; color: #333;">
              <h2 style="color: #2563eb;">Payment Successfully Verified</h2>
              <p>Hello ${req.user.name},</p>
              <p>Your payment has been successfully verified by our system.</p>
              <div style="background: #f3f4f6; padding: 16px; border-radius: 8px;">
                <p><strong>Amount:</strong> INR ${amount}</p>
                <p><strong>Payment ID:</strong> ${razorpay_payment_id}</p>
                <p><strong>Order ID:</strong> ${razorpay_order_id}</p>
              </div>
              <p>Thank you for using DentaAI.</p>
              <p>Regards,<br /><strong>DentaAI Team</strong></p>
            </div>
          `,
        });
      } catch (fetchErr) {
        console.error("Failed to fetch Razorpay payment details:", fetchErr.message);
      }

      return res.status(200).json({ message: "Payment verified successfully", verified: true });
    } else {
      // Invalid signature
      return res.status(400).json({ message: "Invalid signature sent!", verified: false });
    }
  } catch (error) {
    console.error("Razorpay Verify Payment Error:", error);
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

module.exports = {
  createOrder,
  verifyPayment
};
