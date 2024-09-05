"use client";

import { useEffect, useState, useRef } from "react";
import { GraphQLClient, gql } from "graphql-request";
import { CanvasClient } from '@dscvr-one/canvas-client-sdk';

import { type Sketch } from "@p5-wrapper/react";
import { NextReactP5Wrapper } from "@p5-wrapper/next";
import { P5CanvasInstance } from "@p5-wrapper/react";


const client = new GraphQLClient("https://api.dscvr.one/graphqlsss");

const query = gql`
  query($username: String!) {
    userByName(name: $username) {
      id
      username
      followingCount
      followerCount
      dscvrPoints
    }
  }
`;

export default function Home() {
  interface UserResponse {
    userByName: {
      id: string;
      username: string;
      followingCount: number;
      followerCount: number;
      dscvrPoints: number;
    };
  }

  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const p5Ref = useRef<P5CanvasInstance | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const canvasClient = new CanvasClient();
        const response = await canvasClient.ready(); // Changed to use the ready method

        if (response) {
          const user = response.untrusted.user;
          const content = response.untrusted.content;

          if (user?.username) {
            const gqlResponse: UserResponse = await client.request(query, { username: user.username });
            if (gqlResponse?.userByName) {
              setUser(gqlResponse.userByName);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        console.log("Fetching data complete");
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }




  const sketch: Sketch = (p5) => {
    p5Ref.current = p5; // Store the p5 instance in the ref

    let img: any;
    let font: any;

    p5.preload = () => {
      font = p5.loadFont('Roboto/Roboto-Regular.ttf');
      img = p5.loadImage('Cptn_BlockBeard_w2.jpg');
    };

    p5.setup = () => {
      p5.createCanvas(600, 400);
      p5.noLoop();
    };

    p5.draw = () => {
      const str = user?.username || 'DSCVR';
      let hash = 0;
      str.split('').forEach((char: any) => {
        hash = char.charCodeAt(0) + ((hash << 5) - hash);
      });
      let colorStr = '#';
      for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xff;
        colorStr += value.toString(16).padStart(2, '0');
      }

      p5.background(colorStr);

      if (img) {
        img.resize(300, 0);
        p5.tint(colorStr);
        p5.image(img, 0, 0); // Draw the image at the top-left corner
        console.log(`Image size: ${img.width} x ${img.height}`);
      } else {
        console.log('Image not loaded yet');
      }

      p5.text(user?.username || 'DSCVR', 30, 30);
      p5.text(colorStr, 30, 60);
    };
  };

  const saveCanvasToServer = async () => {
    if (p5Ref.current) {
      const p5Instance = p5Ref.current;
  
      // Get the canvas element using the p5 instance's select method or by directly querying it
      const canvasElement = document.querySelector('canvas');
  
      if (canvasElement) {
        canvasElement.toBlob(async (blob: any) => {
          const formData = new FormData();
          formData.append('canvasImage', blob, 'canvas-image.png');
  
          try {
            const response = await fetch('/api/saveCanvas', {
              method: 'POST',
              body: formData,
            });
  
            if (response.ok) {
              const data = await response.json();
              console.log('Canvas saved successfully on IPFS:', data.ipfsHash);
            } else {
              console.error('Failed to save canvas');
            }
          } catch (error) {
            console.error('Error saving canvas:', error);
          }
        }, 'image/png');
      } else {
        console.log('Canvas element not found');
      }
    } else {
      console.log('Canvas is not ready yet');
    }
  };
  

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div>
        <h1>User: {user?.username || 'Not available'}</h1>
        <p>Following: {user?.followingCount || 'Not available'}</p>
        <p>Followers: {user?.followerCount || 'Not available'}</p>
        <p>DSCVR Points: {user?.dscvrPoints || 'Not available'}</p>
      </div>
      <NextReactP5Wrapper sketch={sketch} />
      <button onClick={saveCanvasToServer}>Save Canvas</button>
    </main>
  );
}
