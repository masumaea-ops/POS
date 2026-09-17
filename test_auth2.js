fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ identifier: 'admin@masuma.co.ke', password: 'admin123' })
}).then(r => r.json()).then(async data => {
  console.log("LOGIN:", data.success, !!data.token, data.permissions);
  if (!data.token) return;
  const usersRes = await fetch('http://localhost:3000/api/users', {
    headers: { 'Authorization': 'Bearer ' + data.token }
  });
  console.log("USERS:", (await usersRes.json()).success);
});
