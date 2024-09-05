"use client";

import { useEffect, useState, useRef } from "react";
import { GraphQLClient, gql } from "graphql-request";
import { CanvasClient } from '@dscvr-one/canvas-client-sdk';

import { type Sketch } from "@p5-wrapper/react";
import { NextReactP5Wrapper } from "@p5-wrapper/next";
import { P5CanvasInstance } from "@p5-wrapper/react";


import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { mplCore } from '@metaplex-foundation/mpl-core'

import { generateSigner } from '@metaplex-foundation/umi'
import { create } from '@metaplex-foundation/mpl-core'

import dotenv from 'dotenv';
dotenv.config();

const umi = createUmi(process.env.RPC_URL!).use(mplCore())


const client = new GraphQLClient("https://api.dscvr.one/graphql");

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
      img = p5.loadImage('chest.jpg');
    };

    p5.setup = () => {
      p5.createCanvas(800, 700);
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

      p5.text(user?.username || 'DSCVR', 400, 310);
      p5.text(user?.dscvrPoints || '0', 400, 350);
      p5.text(colorStr, 30, 60);
    };
  };

  const saveCanvasToServer = async () => {
    if (p5Ref.current) {
      const p5Instance = p5Ref.current;
  
      const canvasElement = document.querySelector('canvas');
  
      if (canvasElement) {
        return new Promise((resolve, reject) => {
          canvasElement.toBlob(async (blob) => {
            const formData = new FormData();
            formData.append('canvasImage', blob as Blob, 'canvas-image.png');
  
            try {
              const response = await fetch('/api/saveCanvas', {
                method: 'POST',
                body: formData,
              });
  
              if (response.ok) {
                const data = await response.json();
                console.log('Canvas saved successfully on IPFS:', data.ipfsHash);
                resolve(data.ipfsHash);
              } else {
                console.error('Failed to save canvas');
                reject('Failed to save canvas');
              }
            } catch (error) {
              console.error('Error saving canvas:', error);
              reject(error);
            }
          }, 'image/png');
        });
      } else {
        console.log('Canvas element not found');
        return null;
      }
    } else {
      console.log('Canvas is not ready yet');
      return null;
    }
  };
  const generateMetadata = (imageUrl:any) => {
    return {
      name: "Your jackpot dscvr profile",
      description: "Generative from your dscvr profile.",
      image: `https://gateway.pinata.cloud/ipfs/${imageUrl}`,
      external_url: "https://www.captainblockbeard.site/",
      attributes: [
        { trait_type: "Chest Material", value: "Polished Steel" },
        { trait_type: "Lock Type", value: "Golden Padlock" },
        { trait_type: "Treasure Type", value: "Glowing Gems" },
        { trait_type: "Chest Pattern", value: "Celtic Swirls" },
        { trait_type: "Lid Status", value: "Open" },
        { trait_type: "Glow Intensity", value: "Bright" },
        { trait_type: "Surrounding Objects", value: "Scattered Coins" },
        { trait_type: "Jackpot Banner", value: "Golden Ribbon" },
      ],
    };
  };

  const handleMintClick = async () => {
    try {
      const imageUrl = await saveCanvasToServer();
      if (imageUrl) {
        const metadata = generateMetadata(imageUrl);
  
        const metadataFormData = new FormData();
        const blob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
        metadataFormData.append('file', blob, 'metadata.json');
  
        const response = await fetch('/api/uploadMetadata', {
          method: 'POST',
          body: metadataFormData,
        });
  
        if (response.ok) {
          const data = await response.json();
          console.log('Metadata saved successfully on IPFS:', data.ipfsHash);
  
          // Now mint the asset using the IPFS URL
          const assetSigner = generateSigner(umi);
          const result = await create(umi, {
            asset: assetSigner,
            name: 'My Asset', // Adjust the asset name as necessary
            uri: `https://gateway.pinata.cloud/ipfs/${data.ipfsHash}`,
          }).sendAndConfirm(umi);
  
          console.log('Asset minted successfully:', result);
          alert(`NFT minted successfully: ${result}`);
        } else {
          console.error('Failed to save metadata');
          alert('Failed to save metadata');
        }
      }
    } catch (error) {
      console.error('Error minting NFT:', error);
      alert('Error minting NFT');
    }
  };
  
  

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      {/* <div>
        <h1>User: {user?.username || 'Not available'}</h1>
        <p>Following: {user?.followingCount || 'Not available'}</p>
        <p>Followers: {user?.followerCount || 'Not available'}</p>
        <p>DSCVR Points: {user?.dscvrPoints || 'Not available'}</p>
      </div> */}
      <NextReactP5Wrapper sketch={sketch} />
      <button onClick={handleMintClick}>Mint your custom dscvr NFT</button>
    </main>
  );
}
