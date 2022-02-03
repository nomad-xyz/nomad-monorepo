import { NomadMessage } from "./consumer";

import { messages, Prisma, PrismaClient } from '@prisma/client'
import { BigNumber } from "ethers";

// function fromDb(m: messages): NomadMessage {
//   return 

// }

// function toDb(m: NomadMessage): Prisma.messagesCreateManyInput {
//   return {
//     hash: m.hash,
//     origin: m.origin,
//     destination: m.destination,
//     nonce: m.nonce,
//     nomad_sender: m.nomadSender,
//     nomad_recipient: m.nomadRecipient,
//     root: m.root,
//     state: m.state,
//     block: m.block,
//     dispatched_at: m.timings.dispatchedAt,
//     updated_at: m.timings.updatedAt,
//     relayed_at: m.timings.relayedAt,
//     received_at: m.timings.receivedAt,
//     processed_at: m.timings.processedAt,
//     sender: m.sender,
//     bridge_msg_type: m.bridgeMsgType,
//     recipient: m.bridgeMsgTo,
//     bridge_msg_amount: m.bridgeMsgAmount?.toHexString() || undefined,
//     bridge_msg_allow_fast: m.bridgeMsgAllowFast,
//     bridge_msg_details_hash: m.bridgeMsgDetailsHash,
//     bridge_msg_token_domain: m.bridgeMsgTokenDomain,
//     bridge_msg_token_id: m.bridgeMsgTokenId,
//     raw: m.raw,
//     leaf_index: m.leafIndex.toHexString(),
//     evm: m.evm,
//   }
// }

export interface MsgRequest {
  size?: number;
  page?: number;
  destination?: number;
  origin?: number;
  recipient?: string;
  sender?: string;
}


export class DB {
  client: PrismaClient;
  syncedOnce: boolean;

  constructor() {
    this.syncedOnce = false;
    this.client = new PrismaClient();
  }

  async connect() {
  }

  async disconnect() {
    await this.client.$disconnect();
  }

  get startupSync() {
    const value = this.syncedOnce;
    this.syncedOnce = true;
    return !value;
  }

  async getMessageByEvm(tx: string): Promise<NomadMessage[]> {
    const messages = await this.client.messages.findMany({
      where: {
        tx
      }
    });

    return messages.map(NomadMessage.deserialize)
  }

  async getMessageByHash(messageHash: string): Promise<NomadMessage | undefined> {
    const message = await this.client.messages.findUnique({
      where: {
        messageHash
      }
    });

    return message ? NomadMessage.deserialize(message) : undefined
  }

  async getMessages(req: MsgRequest): Promise<NomadMessage[]> {
    const take = req.size || 15;
    const page = req.page || 1;
    const skip = (page || -1) * take;

    const messages = await this.client.messages.findMany({
      where: {
        sender: req.sender,
        recipient: req.recipient,
        origin: req.origin,
        destination: req.destination,
      },
      take,
      skip
    });

    return messages.map(NomadMessage.deserialize)
  }

  async insertMessage(messages: NomadMessage[]) {
    if (!messages.length) return;
    
    return await this.client.messages.createMany({
      data: messages.map(message => message.serialize()),
      skipDuplicates: true,
    })
  }

  async updateMessage(messages: NomadMessage[]) {
    if (!messages.length) return;

    return await Promise.all(messages.map(m => {
      this.client.messages.update({
        where: {
          messageHash: m.messageHash
        },
        data: m.serialize(),
      })
    }));
  }

  async getExistingHashes(): Promise<string[]> {
    const rows = await this.client.messages.findMany({
      select: {
        messageHash: true
      }
    });
    return rows.map(row => row.messageHash)
  }

  async getAllKeyPair(namespace: string): Promise<Map<string, string>> {
    const rows = await this.client.kv_storage.findMany({
      select: {
        key: true,
        value: true
      },
      where: {
        namespace
      }
    });
    return new Map(rows.map(row => [row.key, row.value]))
  }

  async getKeyPair(namespace: string, key: string): Promise<string | undefined> {
    const row = await this.client.kv_storage.findUnique({
      select: {
        value: true
      },
      where: {
        namespace_key: {
          namespace,
          key
        }
      }
    });
    if (row) return row.value;
    return undefined
  }

  async setKeyPair(namespace: string, key: string, value: string): Promise<void> {
    const where: Prisma.kv_storageWhereUniqueInput = {
      namespace_key: {
        namespace, key
      }
    };

    const create: Prisma.kv_storageCreateInput = {
      namespace, key, value
    };
    const update: Prisma.kv_storageUpdateInput =  {
      value
    };
    await this.client.kv_storage.upsert({
      where,
      update,
      create,
    })

    // const found = await this.getKeyPair(namespace, key);
    // if (found) {
    //   await this.client.kv_storage.update({
    //     where,
    //     data: update,
    //   })
    // } else {
    //   await this.client.kv_storage.create({
    //     data: create
    //   })
    // }
  }
}
