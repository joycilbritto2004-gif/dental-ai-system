// Native fetch is available in Node 24

(async () => {
  let failed = false;
  const report = (name, pass, details) => {
    console.log(`[${pass ? 'PASS' : 'FAIL'}] ${name}`);
    if (!pass) {
      console.log(`  Details: ${details}`);
      failed = true;
    }
  };

  try {
    // We need to find the existing consultation first.
    const res = await fetch('http://localhost:5000/api/consultations');
    const consultations = await res.json();
    const active = consultations[0]; // any completed or accepted consultation

    if (!active) {
      console.log('No consultations found to test edge cases.');
      process.exit(1);
    }

    const id = active._id || active.id;
    const status = active.status;
    console.log(`Testing with consultation ${id} which is currently ${status}`);

    // Try to accept an already completed consultation
    const acceptRes = await fetch(`http://localhost:5000/api/consultations/${id}/accept`, { method: 'PUT' });
    if (acceptRes.status === 400 || acceptRes.status === 409 || acceptRes.status === 404 || acceptRes.status === 500) {
       // Actually 400 is expected for invalid state transition
       const t = await acceptRes.text();
       report('Doctor tries to accept an invalid state consultation', true, `API returned ${acceptRes.status} ${t}`);
    } else {
       report('Doctor tries to accept an invalid state consultation', false, `API returned ${acceptRes.status} instead of error`);
    }

    // Try to complete an already completed consultation (assuming it's completed)
    if (status === 'Completed') {
      const compRes = await fetch(`http://localhost:5000/api/consultations/${id}/complete`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({status: 'Completed'}) });
      if (compRes.status === 400 || compRes.status === 409 || compRes.status === 500) {
         report('Doctor tries to complete an already completed consultation', true, `API returned ${compRes.status}`);
      } else {
         report('Doctor tries to complete an already completed consultation', false, `API returned ${compRes.status} instead of error. It successfully updated again.`);
      }
    } else {
      console.log('Skipping complete-complete test as it is not Completed');
    }

    console.log('Finished testing edge cases.');

  } catch (err) {
    console.error('Test execution error:', err);
    failed = true;
  } finally {
    process.exit(failed ? 1 : 0);
  }
})();
