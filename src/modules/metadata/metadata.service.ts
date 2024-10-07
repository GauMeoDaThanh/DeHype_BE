import { Injectable, BadRequestException } from '@nestjs/common';
import { Web3Storage, File } from 'web3.storage';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MetadataService {
  private readonly storage: Web3Storage;

  constructor() {
    const ipfsToken = process.env.WEB3_STORAGE_TOKEN; // Store your Web3.Storage token in .env file
    if (!ipfsToken) {
      throw new BadRequestException('IPFS token is required');
    }
    this.storage = new Web3Storage({ token: ipfsToken });
  }

  async uploadMetadata(tokenName: string, tokenSymbol: string, tokenDescription: string, imagePath: string): Promise<string> {
    try {
      // Read image file
      const imageFile = fs.readFileSync(imagePath);
      const imageCid = await this.storage.put([new File([imageFile], path.basename(imagePath))]);
      const ipfsImageUri = `https://ipfs.io/ipfs/${imageCid}/${path.basename(imagePath)}`;

      // Create metadata JSON
      const metadata = {
        name: tokenName,
        symbol: tokenSymbol,
        description: tokenDescription,
        image: ipfsImageUri,
      };

      // Convert metadata to a JSON file and upload to IPFS
      const jsonBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
      const jsonFile = new File([jsonBlob], 'metadata.json');
      const jsonCid = await this.storage.put([jsonFile]);

      // Return IPFS URI of the uploaded metadata
      return `https://ipfs.io/ipfs/${jsonCid}/metadata.json`;
    } catch (error) {
      throw new BadRequestException('Error uploading metadata to IPFS');
    }
  }
}
