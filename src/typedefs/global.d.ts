import { ChildProcess } from "child_process";
import { Connection } from "mongoose";
import NodeCache from "node-cache";
import { Server } from "socket.io";
import type { IRole } from "../models/role";
import type { IRoleOrder } from "../models/roleorder";

declare global {
  var forks: Array<NamedChildProcess>
  var env: string
  var timezone: string
  var cache: NodeCache

  //Database
  var CONNECTION_URI: string
  var dbConnection: Connection | null
  var roles: Array<IRole> | undefined
  var roleOrder: IRoleOrder | undefined

  // Socket.io
  var io: Server
  var socketServer: any
}

export type NamedChildProcess = {
  name: string
  fork: ChildProcess
}