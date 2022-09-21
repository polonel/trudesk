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
 *  Updated:    4/12/19 12:20 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import mongoose from 'mongoose'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { makeObservable, observable } from 'mobx'
import { observer } from 'mobx-react'

import { fetchAccounts, unloadAccounts } from 'actions/accounts'
import { updateGroup } from 'actions/groups'
import { createAccountFromChatwoot } from 'actions/accounts'

import BaseModal from 'containers/Modals/BaseModal'
import MultiSelect from 'components/MultiSelect'
import Button from 'components/Button'
import SingleSelect from 'components/SingleSelect'
import helpers from 'lib/helpers'
import $ from 'jquery'
import SpinLoader from 'components/SpinLoader'

@observer
class LoginChatwootContainer extends React.Component {
  @observable username = ''
  @observable phone = ''
  @observable email = ''

  constructor(props) {
    super(props)
    makeObservable(this)
  }

  //Валидация номера телефона
  _validatePhone(phone) {
    if (!phone) return false
    return phone
      .toString()
      .toLowerCase()
      .match(
        /^\+(\d{11})$/
      )
  }



  componentDidMount() {
    // this.props.fetchAccounts({ type: 'customers', limit: -1 })
    // this.name = this.props.group.name
    // this.domainName = this.props.group.domainName
    // this.phone = this.props.group.phone
    // this.email = this.props.group.address
    // helpers.UI.inputs()
    // helpers.UI.reRenderInputs()
    // helpers.formvalidator()
  }

  componentDidUpdate() {
    helpers.UI.reRenderInputs()
  }

  componentWillUnmount() {
    this.props.unloadAccounts()
  }

  onFormSubmit(e) {
    e.preventDefault()
    const $form = $(e.target)
    if (!$form.isValid(null, null, false)) return false

    if (!this._validatePhone(this.phone)) {
      helpers.UI.showSnackbar('Invalid Phone Number', true)
      return
    }

    const payload = { //Полезная нагрузка которая отправляется из формы на сервере для обработки 
      // username: this.props.username,
      // email: this.props.email,
      // phone: this.props.phone,
      username: this.username,
      email: this.email,
      phone: this.phone,
    }

    this.props.createAccountFromChatwoot(payload);
  }

  onInputChangeUsername(e) {
    // this.props.username = e.target.value
    this.username = e.target.value
  }

  onInputChangeEmail(e) {
    // this.props.domainName = e.target.value
    this.email = e.target.value
  }

  onInputChangePhone(e) {
    // this.props.phone = e.target.value
    this.phone = e.target.value 
  }


  render() {
    console.log('chatwoot login')
    // window.addEventListener("message", function (event) {
    //   console.log("Запрос от chatwoot");  
    //   const eventData = JSON.parse(event.data);
    //   data = eventData.data.contact;
    //   this.username = data.name;
    //   this.phone = data.phone;
    //   this.email = data.email;
    // })



    return (
      // <BaseModal>
      //   <div className={'mb-25'}>
      //     <h2>Edit Group</h2>
      //   </div>
      //   <form className={'uk-form-stacked'} onSubmit={e => this.onFormSubmit(e)}>
      //     <div className={'uk-margin-medium-bottom'}>
      //       <label>Username</label>
      //       <input
      //         type='text'
      //         className={'md-input'}
      //         value={this.username}
      //         onChange={e => this.onInputChangeUsername(e)}
      //         data-validation='length'
      //         data-validation-length={'min2'}
      //         data-validation-error-msg={'Please enter a valid Group name. (Must contain 2 characters)'}
      //       />
      //     </div>
      //     <div className={'uk-margin-medium-bottom'}>
      //       <label>Phone Number</label>
      //       <input
      //         type='text'
      //         className={'md-input'}
      //         value={this.phone}
      //         onChange={e => this.onInputChangePhone(e)}
      //         data-validation='length'
      //         data-validation-length={'min12'}
      //         data-validation-error-msg={'Please enter a valid Phone Number'}
      //       />
      //     </div>
      //     <div className={'uk-margin-medium-bottom'}>
      //       <label>Email</label>
      //       <input
      //         type='text'
      //         className={'md-input'}
      //         value={this.email}
      //         onChange={e => this.onInputChangeEmail(e)}

      //       />
      //     </div>
      //     <div className='uk-modal-footer uk-text-right'>
      //       <Button text={'Close'} flat={true} waves={true} extraClass={'uk-modal-close'} />
      //       <Button text={'Submit'} flat={true} waves={true} style={'primary'} type={'submit'} />
      //     </div>
      //   </form>
      // </BaseModal>
      <div>Chatwoot login</div>
    )
  }
}

LoginChatwootContainer.propTypes = {
  createAccountFromChatwoot: PropTypes.func.isRequired,
}

const mapStateToProps = state => ({

})

export default connect(mapStateToProps, { createAccountFromChatwoot })(LoginChatwootContainer)
