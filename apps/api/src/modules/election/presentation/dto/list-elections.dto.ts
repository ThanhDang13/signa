import { createZodDto } from "@signa/nest-contract";
import { listElectionsContract } from "@signa/contracts-http/election";

export class ListElectionsQueryDto extends createZodDto(listElectionsContract.query!) {}

export class ListElectionsOutputDto extends createZodDto(listElectionsContract.response) {}
