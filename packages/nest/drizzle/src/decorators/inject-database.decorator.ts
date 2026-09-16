import { Inject } from "@nestjs/common";
import { DRIZZLE_DATABASE } from "../tokens";

export const InjectDatabase = (tag?: string): ParameterDecorator => {
  return Inject(tag ? `${DRIZZLE_DATABASE}_${tag}` : DRIZZLE_DATABASE);
};
