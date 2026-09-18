import { useEffect, useState } from "react";

export const useCloudCannonEditor = () => {
  const [isEditable, setIsEditable] = useState(false);

  useEffect(() => {
    // Check if window.inEditorMode (from our previous setup)
    if (typeof window !== "undefined" && window.inEditorMode) {
      setIsEditable(true);
    }
  }, []);

  return isEditable;
};
