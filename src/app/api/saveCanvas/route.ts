import { NextRequest, NextResponse } from 'next/server';
import formidable from 'formidable';
import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const JWT = process.env.PINATA_JWT;

export async function POST(req: NextRequest) {
  const form = formidable();

  try {
    const formData = await req.formData();
    const file = formData.get('canvasImage') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const tempFilePath = `/tmp/${file.name}`;
    fs.writeFileSync(tempFilePath, buffer);

    // Prepare the form data to send to Pinata
    const pinataFormData = new FormData();
    pinataFormData.append('file', fs.createReadStream(tempFilePath));

    pinataFormData.append('pinataMetadata', JSON.stringify({ name: 'Canvas Image' }));
    pinataFormData.append('pinataOptions', JSON.stringify({ cidVersion: 0 }));

    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      pinataFormData,
      {
        maxBodyLength: Infinity,
        headers: {
          'Content-Type': `multipart/form-data; boundary=${pinataFormData.getBoundary()}`,
          'Authorization': `Bearer ${JWT}`,
        },
      }
    );

    // Clean up the temporary file
    fs.unlinkSync(tempFilePath);

    return NextResponse.json({
      success: true,
      ipfsHash: response.data.IpfsHash,
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error processing request' }, { status: 500 });
  }
}