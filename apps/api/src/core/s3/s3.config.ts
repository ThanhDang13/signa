import { Injectable } from "@nestjs/common";
import { InjectConfig } from "@signa/nest-config";
import { NestS3OptionsFactory, NestS3Options, createAwsS3Service } from "@signa/nest-s3";
import { S3_CONFIG, type S3Config } from "@signa/api/core/config/tokens";

@Injectable()
export class S3ConfigService implements NestS3OptionsFactory {
  constructor(
    @InjectConfig(S3_CONFIG)
    private readonly config: S3Config
  ) {}

  create(): NestS3Options {
    return {
      s3: createAwsS3Service({
        bucket: this.config.bucket,
        region: this.config.region,
        credentials: this.config.credentials,
        endpoint: this.config.endpoint,
        publicEndpoint: this.config.publicEndpoint,
        forcePathStyle: this.config.forcePathStyle
      })
    };
  }
}
