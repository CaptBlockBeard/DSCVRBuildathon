"use client";

import { useEffect, useState } from "react";
import { GraphQLClient, gql } from "graphql-request";
import { CanvasClient } from '@dscvr-one/canvas-client-sdk';

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

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div>
        <h1>User: {user?.username || 'Not available'}</h1>
        <p>Following: {user?.followingCount || 'Not available'}</p>
        <p>Followers: {user?.followerCount || 'Not available'}</p>
        <p>DSCVR Points: {user?.dscvrPoints || 'Not available'}</p>
      </div>
    </main>
  );
}