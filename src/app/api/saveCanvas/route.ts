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
  
      if (file) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const tempFilePath = `/tmp/${file.name}`;
        fs.writeFileSync(tempFilePath, buffer);
  
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
  
        fs.unlinkSync(tempFilePath);
  
        return NextResponse.json({
          success: true,
          ipfsHash: response.data.IpfsHash,
        });
  
      } else {
        const metadataBuffer = Buffer.from(await req.arrayBuffer());
        const metadataFormData = new FormData();
        metadataFormData.append('file', metadataBuffer, 'metadata.json');
  
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
      }
    } catch (error) {
      console.error('Error:', error);
      return NextResponse.json({ error: 'Error processing request' }, { status: 500 });
    }
  }
  