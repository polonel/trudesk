/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Author:     Chris Brame
 *  Updated:    7/22/22 2:36 AM
 *  Copyright (c) 2014-2022. All rights reserved.
 */

import path from 'path'
import fs from 'fs'
import nconf from 'nconf'
import nconfyaml from 'nconf-yaml'
import Chance from 'chance'
import YAML from "yaml";

nconf.argv().env()

const chance = new Chance()
const configFile = path.join(__dirname, '../../config.yml')

export const hasConfigFile = () => fs.existsSync(configFile)

export const loadConfig = () => {
  nconf.file({
    file: configFile,
    format: nconfyaml
  })

  const jwt = process.env['TRUDESK_JWTSECRET']

  nconf.defaults({
    base_dir: path.join(__dirname, '../../'),
    tokens: {
      secret: jwt || chance.hash() + chance.hash(),
      expires: 900
    }
  })
}

export const get = (item: string) => {
  return nconf.get(item)
}

// This was here to convert from .json config to .yml...
// Should be removed sooner or later
export const checkForOldConfig = () => {
  const oldConfigFile = path.join(__dirname, '../../config.json')
  if (fs.existsSync(oldConfigFile)) {
    // Convert config to yaml.
    const content = fs.readFileSync(oldConfigFile)
    const data = JSON.parse(content.toString())

    fs.writeFileSync(configFile, YAML.stringify(data))

    // Rename the old config.json to config.json.bk
    fs.renameSync(oldConfigFile, path.join(__dirname, '../../config.json.bk'))
  }
}