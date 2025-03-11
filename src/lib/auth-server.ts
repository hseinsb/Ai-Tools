import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";

interface JwtPayload {
  id: string;
  email: string;
  iat?: number;
  exp?: number;
}

interface AuthUser {
  id: string;
  uid?: string;
  username: string;
  email: string;
  createdAt: string;
}

// Helper function to check if a string is a valid MongoDB ObjectId
function isValidObjectId(id: string): boolean {
  return Types.ObjectId.isValid(id) && new Types.ObjectId(id).toString() === id;
}

// Get the authenticated user from JWT token in cookies
export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    // Get auth token from cookies - must use await with cookies()
    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value;

    // Also check for firebase credentials cookie as a fallback
    const firebaseCredentials = cookieStore.get(
      "firebase-user-credentials"
    )?.value;

    // Log available cookies for debugging
    console.log(
      "Available cookies:",
      cookieStore
        .getAll()
        .map((c) => c.name)
        .join(", ") || "none"
    );

    if (!token && !firebaseCredentials) {
      console.log("No authentication found in cookies");
      return null;
    }

    // If we have firebase credentials, use those
    if (firebaseCredentials) {
      console.log("Using firebase credentials for authentication");
      try {
        const credentials = JSON.parse(firebaseCredentials);

        if (credentials && credentials.uid) {
          console.log("Found firebase UID:", credentials.uid);

          // Create a user from firebase credentials
          return {
            id: credentials.uid,
            uid: credentials.uid,
            username: credentials.email
              ? credentials.email.split("@")[0]
              : `user_${credentials.uid.substring(0, 5)}`,
            email: credentials.email || `${credentials.uid}@example.com`,
            createdAt: new Date().toISOString(),
          };
        }
      } catch (e) {
        console.error("Error parsing firebase credentials:", e);
      }
    }

    // If no firebase credentials or they were invalid, fall back to JWT token
    if (!token) {
      console.log("No auth token found");
      return null;
    }

    // Verify the token
    const JWT_SECRET =
      process.env.JWT_SECRET || "fallback-secret-for-development";

    // Decode the token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // For development, return a mock user if using dummy data
    if (process.env.NEXT_PUBLIC_USE_DUMMY_DATA === "true") {
      return {
        id: "mock-user-id",
        uid: "mock-user-id",
        username: "Mock User",
        email: decoded.email || "mock@example.com",
        createdAt: new Date().toISOString(),
      };
    }

    // Return basic user info from token
    return {
      id: decoded.id,
      uid: decoded.id,
      username: decoded.email.split("@")[0],
      email: decoded.email,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Auth server error:", error);

    // For development, return a mock user if using dummy data
    if (process.env.NEXT_PUBLIC_USE_DUMMY_DATA === "true") {
      return {
        id: "mock-user-id",
        uid: "mock-user-id",
        username: "Mock User",
        email: "mock@example.com",
        createdAt: new Date().toISOString(),
      };
    }

    return null;
  }
}
