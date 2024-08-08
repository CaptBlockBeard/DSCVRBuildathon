"use client";

import { useEffect, useState } from "react";
import { handleResponse } from "./components/canvas";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [content, setContent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await handleResponse();
        if (response?.user && response?.content) {
          setUser(response.user);
          setContent(response.content);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div>
        <h1>User: {user?.username || 'Not available'}</h1>
        <p>Content: {content?.portalName || 'Not available'}</p>
      </div>
    </main>
  );
}