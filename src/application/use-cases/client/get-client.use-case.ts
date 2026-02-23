import { Client } from "../../../domain/entities/client.entity";
import { IClientRepository } from "../../../domain/repositories/client.repository";
import { NotFoundError } from "../../../domain/errors/domain.error";

/**
 * Use case: Retrieve a client profile by its own ID.
 */
export class GetClientUseCase {
  constructor(private readonly clientRepository: IClientRepository) {}

  /**
   * Finds a client profile by ID.
   * @param id - The client profile's ID
   * @returns The found client profile
   * @throws NotFoundError when the client profile does not exist
   */
  async execute(id: number): Promise<Client> {
    const client = await this.clientRepository.findById(id);
    if (!client) {
      throw new NotFoundError("Client", id);
    }
    return client;
  }
}
