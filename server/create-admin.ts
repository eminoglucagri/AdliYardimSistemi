import { storage } from "./storage";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function createAdminUser() {
  try {
    // Check if admin already exists
    const existingAdmin = await storage.getUserByRegistryNumber("ADMIN001");
    if (existingAdmin) {
      console.log("Admin user already exists");
      return { message: "Admin user already exists", user: existingAdmin };
    }

    // Create admin user with properly hashed password
    const hashedPassword = await hashPassword("admin123");
    
    const adminUser = await storage.createUser({
      registryNumber: "ADMIN001",
      name: "System Administrator",
      title: "System Admin",
      password: hashedPassword,
      isAdmin: true,
    });

    console.log("Admin user created successfully!");
    console.log("Registry Number: ADMIN001");
    console.log("Password: admin123");
    
    return { message: "Admin user created successfully", user: adminUser };
  } catch (error) {
    console.error("Error creating admin user:", error);
    throw error;
  }
}