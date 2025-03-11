import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { deleteTool } from "@/lib/tools-service-firebase";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  link: string;
  userId?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  pricing?: string;
  tags?: string;
}

interface ToolCardProps {
  tool: Tool;
  onUpdate?: () => void;
  selectMode?: boolean;
  isSelected?: boolean;
  onSelectToggle?: () => void;
}

export default function ToolCard({
  tool,
  onUpdate,
  selectMode = false,
  isSelected = false,
  onSelectToggle,
}: ToolCardProps) {
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [cardBounds, setCardBounds] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [isHovering, setIsHovering] = useState(false);
  const [cardEl, setCardEl] = useState<HTMLDivElement | null>(null);
  const router = useRouter();

  // Check if the current user is the creator of this tool or if it's a mock tool

  // Allow editing of all tools for better user experience
  const canEdit = user !== null; // As long as a user is logged in, they can edit

  // Function to handle tool deletion
  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("Are you sure you want to delete this tool?")) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteTool(tool.id, user?.uid || "");
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Error deleting tool:", error);
      alert("Failed to delete tool. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle card click for selection mode
  const handleCardClick = () => {
    if (selectMode && onSelectToggle) {
      onSelectToggle();
    }
  };

  // Handle edit button click
  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (user) {
      // User is authenticated, set cookie and navigate to edit page
      console.log("Edit button clicked, setting user credential cookie");
      Cookies.set(
        "firebase-user-credentials",
        JSON.stringify({ uid: user.uid }),
        { expires: 7 }
      );
      router.push(`/edit/${tool.id}`);
    } else {
      // User is not authenticated, show login prompt and redirect to login page
      if (
        confirm("You need to log in to edit tools. Do you want to log in now?")
      ) {
        router.push(`/login?callbackUrl=/edit/${tool.id}`);
      }
    }
  };

  // Format the link for display
  const formatLink = (link: string) => {
    if (!link) return "";
    try {
      const url = new URL(link);
      return url.hostname;
    } catch {
      return link;
    }
  };

  // Track mouse movement for the interactive glow effect
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardEl) return;

    const rect = cardEl.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setCardBounds({
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    });
  };

  // Calculate the angle and distance for the glow effect
  const calculateGlowStyles = () => {
    if (!isHovering) {
      return {
        background: `radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.15) 0%, rgba(17, 24, 39, 0) 70%)`,
      };
    }

    const x = mousePosition.x / cardBounds.width;
    const y = mousePosition.y / cardBounds.height;

    return {
      background: `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(56, 189, 248, 0.4) 0%, rgba(17, 24, 39, 0) 70%)`,
    };
  };

  // Main card style - futuristic dark design with subtle glass effect
  const cardStyle = {
    backgroundColor: "rgba(17, 24, 39, 0.95)", // Nearly black background
    backgroundImage: "linear-gradient(135deg, #1e3a8a 0%, #172554 100%)", // Deep blue gradient
    color: "white",
    borderRadius: "0.75rem",
    padding: "1.25rem",
    boxShadow: isHovering
      ? "0 0 25px rgba(56, 189, 248, 0.3), 0 0 0 1px rgba(56, 189, 248, 0.2) inset, 0 0 0 1px rgba(219, 234, 254, 0.1)"
      : "0 4px 20px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(219, 234, 254, 0.1) inset",
    position: "relative" as const,
    overflow: "hidden",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
    transform: isHovering ? "translateY(-4px)" : "translateY(0)",
    border: isSelected
      ? "2px solid #38bdf8"
      : "1px solid rgba(219, 234, 254, 0.1)",
  };

  // Glow overlay
  const glowOverlayStyle = {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none" as const,
    zIndex: 2,
    opacity: isHovering ? 1 : 0,
    transition: "opacity 0.3s ease",
    ...calculateGlowStyles(),
  };

  // Title with futuristic feel
  const titleStyle = {
    fontSize: "1.25rem",
    fontWeight: "bold",
    color: "white",
    marginBottom: "0.75rem",
    display: "flex",
    alignItems: "center",
  };

  // Category badge with glow
  const categoryStyle = {
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    color: "#38bdf8",
    padding: "0.25rem 0.75rem",
    borderRadius: "9999px",
    fontSize: "0.75rem",
    fontWeight: "medium",
    border: "1px solid rgba(56, 189, 248, 0.3)",
    boxShadow: isHovering ? "0 0 10px rgba(56, 189, 248, 0.3)" : "none",
    transition: "box-shadow 0.3s ease",
  };

  // Description text
  const descriptionStyle = {
    color: "rgba(219, 234, 254, 0.8)",
    marginBottom: "0.75rem",
    fontSize: "0.875rem",
    lineHeight: "1.5",
  };

  // Button styles for actions

  return (
    <div
      style={cardStyle}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onMouseMove={handleMouseMove}
      ref={setCardEl}
    >
      {/* Interactive glow overlay */}
      <div style={glowOverlayStyle}></div>

      {/* Subtle card pattern - optional dots/grid for futuristic feel */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage:
            "radial-gradient(rgba(219, 234, 254, 0.1) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          pointerEvents: "none",
          opacity: 0.4,
          zIndex: 1,
        }}
      ></div>

      {/* Content wrapper to ensure it appears above the background effects */}
      <div style={{ position: "relative", zIndex: 3 }}>
        {/* Card Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "0.75rem",
          }}
        >
          <h3 style={titleStyle}>
            {/* Optional futuristic accent */}
            <span
              style={{
                display: "inline-block",
                width: "8px",
                height: "8px",
                borderRadius: "1px",
                backgroundColor: "#38bdf8",
                marginRight: "8px",
                boxShadow: "0 0 5px #38bdf8",
              }}
            ></span>
            {tool.name || "Unnamed Tool"}
          </h3>
          <span style={categoryStyle}>{tool.category || "Uncategorized"}</span>
        </div>

        {/* Description */}
        <p style={descriptionStyle}>
          {tool.description || "No description provided"}
        </p>

        {/* Tool metadata */}
        {tool.pricing && (
          <p
            style={{
              fontSize: "0.75rem",
              color: "rgba(219, 234, 254, 0.6)",
              marginBottom: "0.25rem",
            }}
          >
            <span
              style={{ fontWeight: "bold", color: "rgba(219, 234, 254, 0.8)" }}
            >
              Pricing:
            </span>{" "}
            {tool.pricing}
          </p>
        )}

        {tool.tags && (
          <p
            style={{
              fontSize: "0.75rem",
              color: "rgba(219, 234, 254, 0.6)",
              marginBottom: "0.5rem",
            }}
          >
            <span
              style={{ fontWeight: "bold", color: "rgba(219, 234, 254, 0.8)" }}
            >
              Tags:
            </span>{" "}
            {tool.tags}
          </p>
        )}

        {/* Card actions */}
        <div
          style={{
            marginTop: "1rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {tool.link && (
            <a
              href={tool.link}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: "0.875rem",
                color: "#38bdf8",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                transition: "color 0.2s ease",
              }}
              onMouseOver={(e) => {
                (e.target as HTMLElement).style.color = "#7dd3fc";
              }}
              onMouseOut={(e) => {
                (e.target as HTMLElement).style.color = "#38bdf8";
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {formatLink(tool.link)}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                style={{ width: "14px", height: "14px", marginLeft: "4px" }}
              >
                <path
                  fillRule="evenodd"
                  d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </a>
          )}

          {/* Show edit/delete buttons for all tools when user is logged in and not in select mode */}
          {!selectMode && (
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={handleEditClick}
                style={{
                  fontSize: "0.75rem",
                  padding: "0.25rem 0.75rem",
                  backgroundColor: "rgba(29, 78, 216, 0.8)",
                  color: "white",
                  borderRadius: "0.25rem",
                  display: "flex",
                  alignItems: "center",
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                  border: "1px solid rgba(219, 234, 254, 0.2)",
                  cursor: "pointer",
                }}
                onMouseOver={(e) => {
                  (e.target as HTMLElement).style.backgroundColor =
                    "rgba(29, 78, 216, 1)";
                }}
                onMouseOut={(e) => {
                  (e.target as HTMLElement).style.backgroundColor =
                    "rgba(29, 78, 216, 0.8)";
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  style={{ width: "12px", height: "12px", marginRight: "4px" }}
                >
                  <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                  <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
                </svg>
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                style={{
                  fontSize: "0.75rem",
                  padding: "0.25rem 0.75rem",
                  backgroundColor: isDeleting
                    ? "rgba(185, 28, 28, 0.5)"
                    : "rgba(185, 28, 28, 0.8)",
                  color: "white",
                  borderRadius: "0.25rem",
                  display: "flex",
                  alignItems: "center",
                  border: "1px solid rgba(254, 202, 202, 0.2)",
                  cursor: isDeleting ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseOver={(e) => {
                  if (!isDeleting)
                    (e.target as HTMLElement).style.backgroundColor =
                      "rgba(185, 28, 28, 1)";
                }}
                onMouseOut={(e) => {
                  if (!isDeleting)
                    (e.target as HTMLElement).style.backgroundColor =
                      "rgba(185, 28, 28, 0.8)";
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  style={{ width: "12px", height: "12px", marginRight: "4px" }}
                >
                  <path
                    fillRule="evenodd"
                    d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                    clipRule="evenodd"
                  />
                </svg>
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Selection indicator with animation */}
      {selectMode && (
        <div
          style={{
            position: "absolute",
            top: "0.75rem",
            right: "0.75rem",
            zIndex: 10,
            animation: isSelected ? "pulse 2s infinite" : "none",
          }}
        >
          <div
            style={{
              width: "1.5rem",
              height: "1.5rem",
              borderRadius: "9999px",
              backgroundColor: isSelected
                ? "#38bdf8"
                : "rgba(219, 234, 254, 0.2)",
              border: isSelected
                ? "none"
                : "1px solid rgba(219, 234, 254, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
              boxShadow: isSelected
                ? "0 0 10px rgba(56, 189, 248, 0.5)"
                : "none",
            }}
          >
            {isSelected && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="white"
                style={{ width: "0.875rem", height: "0.875rem" }}
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.5);
          }
          70% {
            box-shadow: 0 0 0 6px rgba(56, 189, 248, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(56, 189, 248, 0);
          }
        }
      `}</style>
    </div>
  );
}
