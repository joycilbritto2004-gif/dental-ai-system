const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const envContent = fs.readFileSync(path.join(__dirname, '../backend/.env'), 'utf-8');
const secretMatch = envContent.match(/RAZORPAY_KEY_SECRET=(.+)/);
process.env.RAZORPAY_KEY_SECRET = secretMatch ? secretMatch[1].trim() : '';

const testPaymentSecurity = async () => {
  let passed = 0;
  let failed = 0;

  const report = (name, isPass, details) => {
    console.log(`[${isPass ? 'PASS' : 'FAIL'}] ${name}`);
    if (!isPass) console.log(`   -> ${details}`);
    isPass ? passed++ : failed++;
  };

  try {
    // 1. Get a patient token
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'patient@test.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;

    // 2. Test create order
    const orderRes = await fetch('http://localhost:5000/api/payment/create-order', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ amount: 500 })
    });
    
    const orderData = await orderRes.json();
    report('Create Order (Valid Amount)', orderRes.ok && orderData.id, orderData.message || 'Failed to create order');

    // 3. Test create order missing amount
    const orderResInvalid = await fetch('http://localhost:5000/api/payment/create-order', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({})
    });
    report('Create Order (Missing Amount)', orderResInvalid.status === 400, 'Should reject missing amount');

    // 4. Test verify payment - Invalid signature
    const verifyResInvalid = await fetch('http://localhost:5000/api/payment/verify', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        razorpay_order_id: orderData.id,
        razorpay_payment_id: 'pay_dummy',
        razorpay_signature: 'invalid_signature_string'
      })
    });
    report('Verify Payment (Invalid Signature)', verifyResInvalid.status === 400, 'Should reject invalid signature');

    // 5. Test verify payment - Valid signature (Generated locally to simulate Razorpay payload)
    const sign = orderData.id + "|" + 'pay_dummy123';
    const validSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    const verifyResValid = await fetch('http://localhost:5000/api/payment/verify', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        razorpay_order_id: orderData.id,
        razorpay_payment_id: 'pay_dummy123',
        razorpay_signature: validSignature
      })
    });
    const verifyData = await verifyResValid.json();
    report('Verify Payment (Valid Signature)', verifyResValid.ok && verifyData.verified, 'Should accept valid signature');

  } catch (err) {
    console.error('Test Execution Error:', err);
    failed++;
  }

  console.log(`\nTests completed: ${passed} passed, ${failed} failed.`);
  process.exit(failed > 0 ? 1 : 0);
};

testPaymentSecurity();
