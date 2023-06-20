import { ChildProcess } from "child_process";
import { Connection } from "mongoose";
import NodeCache from "node-cache";
import { Server } from "socket.io";
import type { IRole } from "../models/role";
import type { IRoleOrder } from "../models/roleorder";

export declare global {
  const forks: Array<NamedChildProcess>
  const env: string
  const timezone: string
  const cache: NodeCache

  //Database
  const CONNECTION_URI: string
  const dbConnection: Connection | null
  const roles: Array<IRole> | undefined
  const roleOrder: IRoleOrder | undefined

  // Socket.io
  const io: Server
  const socketServer: any
}

export type NamedChildProcess = {
  name: string
  fork: ChildProcess
}