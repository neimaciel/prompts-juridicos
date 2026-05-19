import crypto from 'crypto';

export interface EncryptedData {
  encryptedContent: string;
  iv: string;
  authTag: string;
  keyHash: string;
}

export class NativeContractCrypto {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32;
  private readonly ivLength = 16;

  private generateUserKey(userId: string): Buffer {
    // Generate deterministic key based on user ID and secret
    const secret = process.env.ENCRYPTION_SECRET || 'default-secret-key-for-development';
    return crypto.pbkdf2Sync(userId, secret, 100000, this.keyLength, 'sha256');
  }

  private hashKey(key: Buffer): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  encryptContract(content: string, userId: string): EncryptedData {
    const key = this.generateUserKey(userId);
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipher(this.algorithm, key, iv);
    
    let encrypted = cipher.update(content, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encryptedContent: encrypted,
      iv: iv.toString('hex'),
      authTag: tag.toString('hex'),
      keyHash: this.hashKey(key)
    };
  }

  decryptContract(encryptedData: EncryptedData, userId: string): string {
    const key = this.generateUserKey(userId);
    
    // Verify key hash for security
    if (this.hashKey(key) !== encryptedData.keyHash) {
      throw new Error('Invalid decryption key');
    }

    const decipher = crypto.createDecipher(
      this.algorithm, 
      key, 
      Buffer.from(encryptedData.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encryptedContent, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // Generate secure hash for file content
  generateFileHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }
}