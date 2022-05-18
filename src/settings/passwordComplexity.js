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
 *  Updated:    5/17/22 6:33 PM
 *  Copyright (c) 2014-2022. All rights reserved.
 */

const { passwordStrength } = require('check-password-strength')
const passwordComplexityOptions = [
  {
    id: 0,
    value: 'Too weak',
    minDiversity: 0,
    minLength: 0
  },
  {
    id: 1,
    value: 'Weak',
    minDiversity: 2,
    minLength: 6
  },
  {
    id: 2,
    value: 'Medium',
    minDiversity: 3,
    minLength: 8
  },
  {
    id: 3,
    value: 'Strong',
    minDiversity: 4,
    minLength: 10
  }
]

const passwordComplexity = {}

passwordComplexity.validate = password => {
  const response = passwordStrength(password, passwordComplexityOptions)
  return !(response.id === 0 || response.id === 1)
}

module.exports = passwordComplexity
