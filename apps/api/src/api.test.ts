import request from "supertest";
import { createApiApp } from "./app";

describe("school-erp-api", () => {
  it("returns health status", async () => {
    const app = createApiApp();
    const response = await request(app).get("/api/v1/health");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe("ok");
  });

  it("lists seeded students", async () => {
    const app = createApiApp();
    const response = await request(app).get("/api/v1/schools/school-demo/students");

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(3);
  });

  it("creates a student and returns it in follow-up search", async () => {
    const app = createApiApp();
    const createResponse = await request(app)
      .post("/api/v1/schools/school-demo/students")
      .send({
        firstName: "Riya",
        lastName: "Kapoor",
        rollNumber: "7C-018",
        class: 7,
        section: "C",
        contact: {
          parentName: "Anil Kapoor",
          parentEmail: "anil.kapoor@example.com",
          parentPhone: "+91-9988776655",
        },
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data.displayName).toBe("Riya Kapoor");

    const searchResponse = await request(app).get(
      "/api/v1/schools/school-demo/students?q=riya",
    );

    expect(searchResponse.status).toBe(200);
    expect(searchResponse.body.data[0].displayName).toBe("Riya Kapoor");
  });
});
