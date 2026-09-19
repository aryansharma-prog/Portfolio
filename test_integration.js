const assert = require("assert");

const BASE_URL = "http://localhost:3000";
const ADMIN_KEY = "aryan_dev_admin_key_2026";

async function runTests() {
  console.log("==================================================");
  console.log(" Running Portfolio Contact & Admin Pipeline Tests");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${name}: ${err.message}`);
      failed++;
    }
  }

  // 1. Health check
  await test("GET /api/health should return 200 healthy", async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, "healthy");
  });

  // 2. Static asset delivery
  await test("GET / should serve index.html with contact form & honeypot", async () => {
    const res = await fetch(`${BASE_URL}/`);
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes('id="contact-form"'), "Missing #contact-form in HTML");
    assert.ok(html.includes('id="contact-gotcha"'), "Missing honeypot #contact-gotcha in HTML");
    assert.ok(html.includes("Prefer email?"), "Missing fallback email text in HTML");
    assert.ok(html.includes('id="admin-modal"'), "Missing #admin-modal in HTML");
  });

  // 3. Valid Contact Submission
  let createdMessageId = null;
  await test("POST /api/contact with valid data should save message & return success", async () => {
    const res = await fetch(`${BASE_URL}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Elon Techlead",
        email: "elon@spacetech.org",
        subject: "Senior Full Stack Opportunity",
        message: "Hi Aryan, we are hiring for our AI & full stack team and would love to speak with you.",
      }),
    });

    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.message, "Message sent successfully! I'll get back to you soon.");
    assert.ok(data.data.id, "Missing saved message ID");
    createdMessageId = data.data.id;
  });

  // 4. Server-Side Field Validation: Missing Name
  await test("POST /api/contact with missing name should return 400 with field error", async () => {
    const res = await fetch(`${BASE_URL}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "",
        email: "valid@email.com",
        message: "This is a valid message.",
      }),
    });

    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.ok(data.errors.some((e) => e.field === "name"));
  });

  // 5. Server-Side Field Validation: Invalid Email
  await test("POST /api/contact with invalid email should return 400 with email error", async () => {
    const res = await fetch(`${BASE_URL}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "not-an-email",
        message: "This is a test message.",
      }),
    });

    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.ok(data.errors.some((e) => e.field === "email"));
  });

  // 6. Anti-Spam Honeypot Trapping
  await test("POST /api/contact with honeypot _gotcha should drop message silently", async () => {
    const res = await fetch(`${BASE_URL}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Spam Robot",
        email: "bot@spammer.com",
        message: "Buy cheap crypto!",
        _gotcha: "im_a_bot",
      }),
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);

    // Verify it was NOT added to admin list
    const adminRes = await fetch(`${BASE_URL}/api/admin/messages?search=spammer.com`, {
      headers: { "x-admin-key": ADMIN_KEY },
    });
    const adminData = await adminRes.json();
    assert.strictEqual(adminData.data.messages.length, 0, "Spam message should NOT be saved");
  });

  // 7. Admin API Security: Unauthorized Access
  await test("GET /api/admin/messages without key should return 401 Unauthorized", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/messages`);
    assert.strictEqual(res.status, 401);
    const data = await res.json();
    assert.strictEqual(data.success, false);
  });

  // 8. Admin API: Retrieve Messages
  await test("GET /api/admin/messages with x-admin-key should return message list", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/messages`, {
      headers: { "x-admin-key": ADMIN_KEY },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.data.messages));
    assert.ok(data.data.messages.some((m) => m.email === "elon@spacetech.org"));
  });

  // 9. Admin API: Get Single Message by ID & Auto-Read
  await test("GET /api/admin/messages/:id should return details and mark as read", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/messages/${createdMessageId}`, {
      headers: { "x-admin-key": ADMIN_KEY },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.name, "Elon Techlead");
    assert.strictEqual(data.data.status, "read");
  });

  // 10. Admin API: Update Status
  await test("PATCH /api/admin/messages/:id/status should update status to replied", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/messages/${createdMessageId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": ADMIN_KEY,
      },
      body: JSON.stringify({ status: "replied" }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.status, "replied");
  });

  // 11. Admin API: Statistics
  await test("GET /api/admin/messages/stats should return aggregate counts", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/messages/stats`, {
      headers: { "x-admin-key": ADMIN_KEY },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(typeof data.data.total === "number");
    assert.ok(typeof data.data.replied === "number");
  });

  // 12. Admin API: Delete Message
  await test("DELETE /api/admin/messages/:id should delete message", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/messages/${createdMessageId}`, {
      method: "DELETE",
      headers: { "x-admin-key": ADMIN_KEY },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);

    // Verify deletion
    const verifyRes = await fetch(`${BASE_URL}/api/admin/messages/${createdMessageId}`, {
      headers: { "x-admin-key": ADMIN_KEY },
    });
    assert.strictEqual(verifyRes.status, 404);
  });

  console.log("==================================================");
  console.log(` Summary: ${passed} Passed, ${failed} Failed`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test suite fatal error:", err);
  process.exit(1);
});
