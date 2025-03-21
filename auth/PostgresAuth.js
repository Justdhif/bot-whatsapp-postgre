const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class PostgresAuth {
  constructor(sessionId) {
    this.sessionId = sessionId;
  }

  async setup(client) {
    this.client = client;
  }

  async beforeBrowserInitialized() {
    console.log("Browser initialized.");
  }

  async afterBrowserInitialized() {
    console.log("Browser has been initialized.");
    // Anda bisa menambahkan logika tambahan di sini jika diperlukan
  }

  async afterAuthReady() {
    console.log("Auth ready.");
  }

  async logout() {
    console.log("Logged out.");
    await this.deleteSession(this.sessionId); // Hapus session saat logout
  }

  async getSession() {
    try {
      const session = await prisma.whatsappSessions.findUnique({
        where: { session_id: this.sessionId },
      });
      return session ? JSON.parse(session.data) : null;
    } catch (error) {
      console.error("Error retrieving session from PostgreSQL:", error);
      return null;
    }
  }

  async saveSession(session) {
    try {
      await prisma.whatsappSessions.upsert({
        where: { session_id: this.sessionId },
        update: { data: JSON.stringify(session) },
        create: { session_id: this.sessionId, data: JSON.stringify(session) },
      });
      console.log("Session saved to PostgreSQL.");
    } catch (error) {
      console.error("Error saving session to PostgreSQL:", error);
    }
  }

  async deleteSession(sessionId) {
    try {
      await prisma.whatsappSessions.delete({
        where: { session_id: sessionId },
      });
      console.log("Session deleted from PostgreSQL.");
    } catch (error) {
      console.error("Error deleting session from PostgreSQL:", error);
    }
  }
}

module.exports = PostgresAuth;
