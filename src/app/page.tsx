"use client";
import { useEffect, useState, useRef } from "react";
import { GraphQLClient, gql } from "graphql-request";
import { CanvasClient } from '@dscvr-one/canvas-client-sdk';
import { createNoopSigner, createSignerFromKeypair, generateSigner, signerIdentity, some } from '@metaplex-foundation/umi';
import { publicKey as umiPublicKey } from '@metaplex-foundation/umi';

import { type Sketch } from "@p5-wrapper/react";
import { NextReactP5Wrapper } from "@p5-wrapper/next";
import { P5CanvasInstance } from "@p5-wrapper/react";

import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplCore } from '@metaplex-foundation/mpl-core';
import { create } from '@metaplex-foundation/mpl-core';

import useCanvasWallet from "./components/CanvasWalletProvider";
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

import dotenv from 'dotenv';
dotenv.config();

if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
}


const umi = createUmi(process.env.NEXT_PUBLIC_RPC_URL!).use(mplCore());

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
  let { publicKey: walletPublicKey } = useWallet();
  const { connectWallet, walletAddress, iframe } = useCanvasWallet();


  interface UserResponse {
    userByName: {
      id: string;
      username: string;
      followingCount: number;
      followerCount: number;
      dscvrPoints: number;
     
    };
  }

  const [user, setUser] = useState<UserResponse['userByName'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const p5Ref = useRef<P5CanvasInstance | null>(null);
  const [canvasClient, setCanvasClient] = useState<CanvasClient | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const client = new CanvasClient();
        const response = await client.ready();
        setCanvasClient(client);

        if (response) {
          const user = response.untrusted.user;
          if (user?.username) {
            const gqlResponse = await fetch("https://api.dscvr.one/graphql", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                query: query,
                variables: { username: user.username },
              }),
            }).then(res => res.json());

            if (gqlResponse?.data?.userByName) {
              setUser(gqlResponse.data.userByName);
            }
          }
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

  const sketch: Sketch = (p5) => {
    p5Ref.current = p5;

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
        p5.tint(colorStr);
        p5.image(img, 0, 0);
      }
      // make the text bigger 
      p5.textSize(20);
      p5.text(user?.username || 'DSCVR', 400, 310);
      p5.textSize(12);
      p5.text(user?.dscvrPoints || '0', 400, 350);
    };
  };

  const saveCanvasToServer = async () => {
    if (p5Ref.current) {
      const canvasElement = document.querySelector('canvas');

      if (canvasElement) {
        return new Promise<string>((resolve, reject) => {
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
                resolve(data.ipfsHash); // Return the IPFS hash as a string
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
      }
    }
    return null; // Return null if canvas is not ready
  };

  const generateMetadata = (imageUrl: string) => {
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
        { trait_type: "dscvr Points", value: user?.dscvrPoints || '0' },
        { trait_type: "Username", value: user?.username || 'DSCVR' },
      ],
    };
  };

  const handleMintClick = async () => {
    if (!canvasClient) {
      console.error('Canvas client not initialized');
      return;
    }

    try {
      const imageUrl = await saveCanvasToServer();
      if (typeof imageUrl === 'string') {
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

          if (walletPublicKey) {
            const umiPublicKeyValue = umiPublicKey(walletPublicKey.toBase58());
            umi.use(signerIdentity(createNoopSigner(umiPublicKeyValue)));
          }

          // Generate the Asset KeyPair
          const asset = generateSigner(umi);
          

          const transaction = await create(umi, {
            asset,
            name: `${user?.username} dscvr jackpot profile`,
            uri: `https://gateway.pinata.cloud/ipfs/${data.ipfsHash}`,
          }).sendAndConfirm(umi)

      
          console.log('Asset minted successfully:', transaction);
          alert(`NFT minted successfully: ${transaction}`);
        } else {
          console.error('Failed to save metadata');
          alert('Failed to save metadata');
        }
      } else {
        console.error('Failed to save canvas: No image URL returned');
      }
    } catch (error) {
      console.error('Error minting NFT:', error);
      if (error instanceof Error) {
        alert(`Error minting NFT: ${error.message}`);
      } else {
        alert('An unknown error occurred while minting the NFT');
      }
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <NextReactP5Wrapper sketch={sketch} />
      <button onClick={handleMintClick}>Mint your custom dscvr NFT</button>
      <WalletMultiButton />
    </main>
  );
}