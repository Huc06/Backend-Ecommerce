import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import FormData from 'form-data';

@Injectable()
export class UploadsService {
  private get pinataJwt(): string {
    const token = process.env.PINATA_JWT;
    if (!token) throw new BadRequestException('PINATA_JWT is not configured');
    return token;
  }

  private buildGatewayUrl(cid: string): string {
    const gw = process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs';
    return `${gw}/${cid}`;
  }

  async uploadImage(buffer: Buffer, filename: string, mimeType: string) {
    try {
      const form = new FormData();
      form.append('file', buffer, { filename, contentType: mimeType });
      form.append('pinataMetadata', JSON.stringify({ name: filename }));

      const res = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        form,
        {
          headers: {
            Authorization: `Bearer ${this.pinataJwt}`,
            ...form.getHeaders(),
          },
          maxBodyLength: Infinity,
        },
      );

      const cid = res.data?.IpfsHash;
      if (!cid) throw new Error('No CID returned from Pinata');
      return { cid, url: this.buildGatewayUrl(cid) };
    } catch (e: any) {
      if (e?.response?.data) {
        throw new InternalServerErrorException(e.response.data);
      }
      throw new InternalServerErrorException('Pinata upload failed');
    }
  }
}
