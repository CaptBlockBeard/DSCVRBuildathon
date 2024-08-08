"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { handleResponse } from "./components/canvas";

export default function Home() {

  const [canvasClient, setCanvasClient] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [content, setContent] = useState<any>(null);

  // load the canvas client
  async function loadCanvasClient() {
    const response = await handleResponse();
    const user = response?.user; // Access user safely
    const content = response?.content; // Access content safely
    if (user && content) {
      console.log(user);
      console.log(content);
      setUser(user);
      setContent(content);
    }
  }

  useEffect(() => {
    loadCanvasClient();
  }, []);



  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">

        <div>
          <h1>user {user?.name}</h1>
          <p>content {content?.message}</p>
        </div>

    </main>
  );
}
