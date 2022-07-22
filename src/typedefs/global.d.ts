import NodeCache from "node-cache";
import { ChildProcess } from "child_process";

export declare global {
  var forks: Array<NamedChildProcess>
  var env: string
  var timezone: string
  var cache: NodeCache

  //Database
  var CONNECTION_URI: string
}

export type NamedChildProcess = {
  name: string
  fork: ChildProcess
}