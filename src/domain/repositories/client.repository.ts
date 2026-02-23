import { Client, CreateClientData, UpdateClientData } from "../entities/client.entity";

/**
 * Port: Client repository interface.
 * Defines the contract for any persistence adapter that manages Client profiles.
 */
export interface IClientRepository {
  /** Create a new client profile linked to an existing user */
  create(data: CreateClientData): Promise<Client>;

  /** Find a client profile by its own ID */
  findById(id: number): Promise<Client | null>;

  /** Find a client profile by the owning user's ID */
  findByUserId(userId: number): Promise<Client | null>;

  /** Update a client profile by its own ID */
  update(id: number, data: UpdateClientData): Promise<Client>;
}
