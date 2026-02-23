import { Client, UpdateClientData } from "../../../domain/entities/client.entity";
import { IClientRepository } from "../../../domain/repositories/client.repository";
import { NotFoundError } from "../../../domain/errors/domain.error";

/**
 * Use case: Update a client profile.
 */
export class UpdateClientUseCase {
  constructor(private readonly clientRepository: IClientRepository) {}

  /**
   * Updates an existing client profile.
   * @param id - The client profile's ID
   * @param data - Fields to update
   * @returns The updated client profile
   * @throws NotFoundError when the client profile does not exist
   */
  async execute(id: number, data: UpdateClientData): Promise<Client> {
    const existing = await this.clientRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Client", id);
    }
    return this.clientRepository.update(id, data);
  }
}
