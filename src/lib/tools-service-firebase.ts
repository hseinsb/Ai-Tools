import { db } from "@/lib/firebase/clientApp";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  DocumentData,
} from "firebase/firestore";

// Export the Tool interface explicitly
export interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  link: string;
  userId: string;
  createdAt?: string;
  pricing?: string;
  tags?: string[];
}

// Also create a type alias just to be safe
export type ToolType = Tool;

// Mock data to return when Firestore fails
const MOCK_TOOLS = [
  {
    id: "mock-1",
    name: "Example AI Tool 1",
    description:
      "This is a mock tool that appears when Firebase data cannot be loaded.",
    category: "Productivity",
    link: "https://example.com",
    userId: "mock-user",
    createdAt: new Date().toISOString(),
  },
  {
    id: "mock-2",
    name: "Example AI Tool 2",
    description: "Another mock tool for demonstration purposes.",
    category: "Content Creation",
    link: "https://example.com",
    userId: "mock-user",
    createdAt: new Date().toISOString(),
  },
  {
    id: "mock-3",
    name: "Example AI Tool 3",
    description: "A third mock tool to show when Firebase fails.",
    category: "Development",
    link: "https://example.com",
    userId: "mock-user",
    createdAt: new Date().toISOString(),
  },
];

// Helper function to safely convert Firestore data
export function convertFirestoreData(doc: DocumentData): Tool {
  const data = doc.data();

  return {
    id: doc.id,
    name: data.name || "Unnamed Tool",
    description: data.description || "",
    category: data.category || "Other",
    link: data.link || "",
    userId: data.userId || "",
    // Fix the timestamp handling to be more robust
    createdAt: data.createdAt
      ? typeof data.createdAt.toDate === "function"
        ? data.createdAt.toDate().toISOString()
        : typeof data.createdAt === "string"
          ? data.createdAt
          : new Date().toISOString()
      : new Date().toISOString(),
    pricing: data.pricing || "Free",
    tags: data.tags || [],
  };
}

export async function getAllTools(): Promise<Tool[]> {
  try {
    if (!db) {
      console.error("Firestore db instance is not available");
      return MOCK_TOOLS;
    }

    const toolsQuery = query(
      collection(db, "tools"),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(toolsQuery);

    const tools: Tool[] = [];
    querySnapshot.forEach((doc) => {
      try {
        tools.push(convertFirestoreData(doc));
      } catch (conversionError) {
        console.error(`Error converting doc ${doc.id}:`, conversionError);
      }
    });

    return tools;
  } catch (error) {
    console.error("Error getting all tools:", error);
    return MOCK_TOOLS;
  }
}

export async function getToolsByCategory(category: string): Promise<Tool[]> {
  try {
    if (!db) {
      console.error("Firestore db instance is not available");
      return MOCK_TOOLS.filter((t) => t.category === category);
    }

    const toolsQuery = query(
      collection(db, "tools"),
      where("category", "==", category),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(toolsQuery);

    const tools: Tool[] = [];
    querySnapshot.forEach((doc) => {
      try {
        tools.push(convertFirestoreData(doc));
      } catch (conversionError) {
        console.error(`Error converting doc ${doc.id}:`, conversionError);
      }
    });

    return tools;
  } catch (error) {
    console.error(`Error getting tools for category ${category}:`, error);
    return MOCK_TOOLS.filter((t) => t.category === category);
  }
}

export async function getToolById(id: string): Promise<Tool | null> {
  try {
    if (!db) {
      console.error("Firestore db instance is not available");
      return MOCK_TOOLS.find((t) => t.id === id) || null;
    }

    const docRef = doc(db, "tools", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return convertFirestoreData(docSnap);
  } catch (error) {
    console.error(`Error getting tool ${id}:`, error);
    return MOCK_TOOLS.find((t) => t.id === id) || null;
  }
}

export async function createTool(
  tool: Omit<Tool, "id" | "createdAt">
): Promise<string> {
  try {
    if (!db) {
      console.error("Firestore db instance is not available");
      return "mock-" + Date.now();
    }

    const toolWithTimestamp = {
      ...tool,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "tools"), toolWithTimestamp);
    return docRef.id;
  } catch (error) {
    console.error("Error creating tool:", error);
    throw error;
  }
}

export async function updateTool(
  id: string,
  updates: Partial<Tool>,
  userId: string
): Promise<void> {
  try {
    if (!db) {
      console.error("Firestore db instance is not available");
      return;
    }

    // First check if the tool exists and belongs to the user
    const docRef = doc(db, "tools", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error("Tool not found");
    }

    const toolData = docSnap.data();
    if (toolData.userId !== userId) {
      throw new Error("Unauthorized to update this tool");
    }

    // Only update allowed fields
    const allowedUpdates: Partial<Tool> = {};

    if ("name" in updates) allowedUpdates.name = updates.name;
    if ("description" in updates)
      allowedUpdates.description = updates.description;
    if ("category" in updates) allowedUpdates.category = updates.category;
    if ("link" in updates) allowedUpdates.link = updates.link;
    if ("pricing" in updates) allowedUpdates.pricing = updates.pricing;
    if ("tags" in updates) allowedUpdates.tags = updates.tags;

    await updateDoc(docRef, {
      ...allowedUpdates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(`Error updating tool ${id}:`, error);
    throw error;
  }
}

export async function deleteTool(id: string, userId: string): Promise<void> {
  try {
    console.log(`Attempting to delete tool ${id} for user ${userId}`);

    if (!db) {
      console.error("Firestore db instance is not available");
      return;
    }

    // First check if the tool exists and belongs to the user
    const docRef = doc(db, "tools", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error("Tool not found");
    }

    const toolData = docSnap.data();
    if (toolData.userId !== userId) {
      throw new Error("Unauthorized to delete this tool");
    }

    // Delete the document
    await deleteDoc(docRef);
    console.log(`Tool ${id} deleted successfully`);
  } catch (error) {
    console.error("Error deleting tool:", error);
    throw error;
  }
}

export async function getToolsByUserId(userId: string): Promise<Tool[]> {
  try {
    console.log(`Getting tools for user: ${userId}`);

    if (!db) {
      console.error("Firestore db instance is not available");
      return MOCK_TOOLS.filter((t) => t.userId === userId);
    }

    const toolsQuery = query(
      collection(db, "tools"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(toolsQuery);
    console.log(`Found ${querySnapshot.docs.length} tools for user ${userId}`);

    const tools: Tool[] = [];
    querySnapshot.forEach((doc) => {
      try {
        tools.push(convertFirestoreData(doc));
      } catch (conversionError) {
        console.error(`Error converting doc ${doc.id}:`, conversionError);
      }
    });

    console.log(`Processed ${tools.length} tools for user ${userId}`);
    return tools;
  } catch (error) {
    console.error("Error getting user tools:", error);
    return MOCK_TOOLS.filter((t) => t.userId === userId);
  }
}

export async function getTools(): Promise<Tool[]> {
  try {
    console.log("Getting all tools");

    if (!db) {
      console.error("Firestore db instance is not available");
      return MOCK_TOOLS;
    }

    const toolsQuery = query(
      collection(db, "tools"),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(toolsQuery);
    console.log(`Found ${querySnapshot.docs.length} tools in total`);

    const tools: Tool[] = [];
    querySnapshot.forEach((doc) => {
      try {
        tools.push(convertFirestoreData(doc));
      } catch (conversionError) {
        console.error(`Error converting doc ${doc.id}:`, conversionError);
      }
    });

    console.log(`Processed ${tools.length} tools total`);
    return tools;
  } catch (error) {
    console.error("Error getting all tools:", error);
    return MOCK_TOOLS;
  }
}

// Add the getUserTools function
export async function getUserTools(userId: string): Promise<Tool[]> {
  try {
    console.log(`Getting tools for user ID: ${userId}`);

    if (!db) {
      console.error("Firestore db instance is not available");
      return MOCK_TOOLS.filter((t) => t.userId === userId);
    }

    const toolsQuery = query(
      collection(db, "tools"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(toolsQuery);

    const tools: Tool[] = [];
    querySnapshot.forEach((doc) => {
      try {
        tools.push(convertFirestoreData(doc));
      } catch (conversionError) {
        console.error(`Error converting doc ${doc.id}:`, conversionError);
      }
    });

    return tools;
  } catch (error) {
    console.error(`Error getting tools for user ${userId}:`, error);
    return MOCK_TOOLS.filter((t) => t.userId === userId);
  }
}
