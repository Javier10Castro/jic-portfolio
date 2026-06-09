const base = "http://localhost:3000";

async function testSendContact() {
  const res = await fetch(base + "/api/sendContact", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: "Deploy Test",
      email: "test@test.com",
      message: "hello"
    })
  });

  console.log("contact:", await res.json());
}

async function testSendBrief() {
  const res = await fetch(base + "/api/sendBrief", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: "Deploy Test",
      email: "test@test.com",
      formData: {}
    })
  });

  console.log("brief:", await res.json());
}

await testSendContact();
await testSendBrief();