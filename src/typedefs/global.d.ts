import NodeCache from "node-cache";
import { ChildProcess } from "child_process";
import type { IRole } from "../models/role";
import { Server } from "socket.io";

export declare global {
  var forks: Array<NamedChildProcess>
  var env: string
  var timezone: string
  var cache: NodeCache

  //Database
  var CONNECTION_URI: string
  var roles: Array<IRole>

  // Socket.io
  var io: Server
  var socketServer: any
}

export type NamedChildProcess = {
  name: string
  fork: ChildProcess
}