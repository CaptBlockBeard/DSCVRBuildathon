import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import FormData from 'form-data';
import dotenv from 'dotenv';

dotenv.config();

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const JWT = process.env.PINATA_JWT;

export async function POST(req: NextRequest) {
  try {
    const metadataBuffer = Buffer.from(await req.arrayBuffer());
    const metadataFormData = new FormData();
    metadataFormData.append('file', metadataBuffer, {
      filename: 'metadata.json',
      contentType: 'application/json',
    });

    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      metadataFormData,
      {
        maxBodyLength: Infinity,
        headers: {
          'Content-Type': `multipart/form-data; boundary=${metadataFormData.getBoundary()}`,
          'Authorization': `Bearer ${JWT}`,
        },
      }
    );

    return NextResponse.json({
      success: true,
      ipfsHash: response.data.IpfsHash,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error processing request' }, { status: 500 });
  }
}
