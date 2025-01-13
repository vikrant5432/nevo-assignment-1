import { plainToClass } from 'class-transformer';
import { IsNumber, IsString, validateSync } from 'class-validator';

export enum EnvironmentType {
  LOCAL = 'local',
  STAGE = 'stage',
  RELEASE = 'release',
  PRODUCTION = 'production',
}

export class EnvironmentDTO {
  @IsNumber()
  PORT: number;

  @IsString()
  BINANCE_API_KEY: string;

  @IsString()
  BINANCE_API_SECRET: string;

  @IsString()
  SOLANA_RPC_URL: string;

  @IsString()
  TRADING_PAIRS: string;
}

/**
 * Validate the configuration against the EnvironmentVariables schema
 * @param configuration The configuration to validate
 * @returns The validated configuration
 * @throws Error if the configuration is invalid
 * @see https://docs.nestjs.com/techniques/configuration#custom-validate-function
 */
export function validateEnvironment(configuration: Record<string, unknown>) {
  const finalConfig = plainToClass(EnvironmentDTO, configuration, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(finalConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return finalConfig;
}
