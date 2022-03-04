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
 *  Updated:    3/2/22 10:58 PM
 *  Copyright (c) 2014-2022. All rights reserved.
 */

import React, { createRef } from 'react'
import PropTypes from 'prop-types'
import PageTitle from 'components/PageTitle'
import PageContent from 'components/PageContent'
import StepWizard from 'components/StepWizard'

class AccountsImportContainer extends React.Component {
  constructor (props) {
    super(props)

    this.csvRef = createRef()
    this.jsonRef = createRef()
    this.ldapRef = createRef()

    this.csvWizardRef = createRef()
    this.jsonWizardRef = createRef()
    this.ldapWizardRef = createRef()
  }

  selectAccountImport = (event, type) => {
    if (!this.csvRef.current || !this.jsonRef.current || !this.ldapRef.current) return
    if (!this.csvWizardRef.current || !this.jsonWizardRef.current || !this.ldapWizardRef.current) return
    if (event.target.classList.contains('card-disabled')) return

    switch (type) {
      case 'csv':
        // this.csvWizardRef.current.classList.remove('uk-hidden')
        this.csvWizardRef.current.show()
        this.jsonRef.current.classList.add('card-disabled')
        this.ldapRef.current.classList.add('card-disabled')
        break
      case 'json':
        this.jsonWizardRef.current.classList.remove('uk-hidden')
        this.csvRef.current.classList.add('card-disabled')
        this.ldapRef.current.classList.add('card-disabled')
        break
      case 'ldap':
        this.ldapWizardRef.current.classList.remove('uk-hidden')
        this.csvRef.current.classList.add('card-disabled')
        this.jsonRef.current.classList.add('card-disabled')
        break
    }
  }

  resetWizards = () => {
    if (!this.csvRef.current || !this.jsonRef.current || !this.ldapRef.current) return
    if (!this.csvWizardRef.current || !this.jsonWizardRef.current || !this.ldapWizardRef.current) return

    this.csvRef.current.classList.remove('card-disabled')
    this.jsonRef.current.classList.remove('card-disabled')
    this.ldapRef.current.classList.remove('card-disabled')

    this.csvWizardRef.current.hide()
    this.jsonWizardRef.current.classList.add('uk-hidden')
    this.ldapWizardRef.current.classList.add('uk-hidden')
  }

  render () {
    return (
      <>
        <PageTitle title={'Accounts Import'} />
        <PageContent>
          <div className='uk-grid uk-grid-medium uk-margin-medium-bottom js-wizard-select-wrapper'>
            <div className='uk-width-1-1 uk-margin-small-bottom'>
              <h3>Select Import Type</h3>
            </div>
            <div className='uk-width-1-3'>
              <div
                id='csv-import-selector'
                ref={this.csvRef}
                className='panel trupanel nopadding md-bg-color-green md-color-white cursor-pointer'
                style={{ minHeight: 85 }}
                onClick={e => this.selectAccountImport(e, 'csv')}
              >
                <div className='tru-card-content'>
                  <div className='right uk-margin-small-top'>
                    <i className='material-icons font-size-40'>description</i>
                  </div>
                  <h2 className='uk-margin-remove'>
                    <span className='md-color-white uk-margin-small-bottom'>CSV</span>
                    <span className='md-color-white uk-text-small uk-display-block'>
                      Import accounts from an uploaded csv
                    </span>
                  </h2>
                </div>
              </div>
            </div>
            <div className='uk-width-1-3'>
              <div
                id='json-import-selector'
                ref={this.jsonRef}
                className='panel trupanel nopadding md-bg-color-blue-grey md-color-white cursor-pointer'
                style={{ minHeight: 85 }}
                onClick={e => this.selectAccountImport(e, 'json')}
              >
                <div className='tru-card-content'>
                  <div className='right uk-margin-small-top'>
                    <svg style={{ width: 40, height: 40 }} viewBox='0 0 24 24'>
                      <path
                        fill='#ffffff'
                        d='M8,3A2,2 0 0,0 6,5V9A2,2 0 0,1 4,11H3V13H4A2,2 0 0,1 6,15V19A2,2 0 0,0 8,21H10V19H8V14A2,2 0 0,0 6,12A2,2 0 0,0 8,10V5H10V3M16,3A2,2 0 0,1 18,5V9A2,2 0 0,0 20,11H21V13H20A2,2 0 0,0 18,15V19A2,2 0 0,1 16,21H14V19H16V14A2,2 0 0,1 18,12A2,2 0 0,1 16,10V5H14V3H16Z'
                      />
                    </svg>
                  </div>
                  <h2 className='uk-margin-remove'>
                    <span className='md-color-white uk-margin-small-bottom'>JSON</span>
                    <span className='md-color-white uk-text-small uk-display-block'>
                      Import accounts from an uploaded json file
                    </span>
                  </h2>
                </div>
              </div>
            </div>
            <div className='uk-width-1-3'>
              <div
                id='ldap-import-selector'
                ref={this.ldapRef}
                className='panel trupanel nopadding md-bg-color-blue md-color-white cursor-pointer'
                style={{ minHeight: 85 }}
                onClick={e => this.selectAccountImport(e, 'ldap')}
              >
                <div className='tru-card-content'>
                  <div className='right uk-margin-small-top'>
                    <i className='material-icons font-size-40'>&#xE875;</i>
                  </div>
                  <h2 className='uk-margin-remove'>
                    <span className='md-color-white uk-margin-small-bottom'>LDAP</span>
                    <span className='md-color-white uk-text-small uk-display-block'>
                      Import accounts from an enterprise ldap server.
                    </span>
                  </h2>
                </div>
              </div>
            </div>
          </div>

          <StepWizard
            title={'CSV Account Import Wizard'}
            subtitle={'This wizard will walk you through importing accounts from a json file.'}
            ref={this.csvWizardRef}
            onCancelClicked={this.resetWizards}
          />
          <div id='json_wizard_card' ref={this.jsonWizardRef} className='uk-grid uk-margin-small-bottom uk-hidden'>
            <div className='uk-width-1-1'>
              <div
                className='panel trupanel nopadding no-hover-shadow'
                style={{ position: 'relative', minHeight: 265 }}
              >
                <div className='left'>
                  <h6 style={{ padding: '10px 0 0 15px', margin: 0, fontSize: 16 }}>JSON Account Import Wizard</h6>
                  <h5
                    style={{ padding: '0 0 10px 15px', margin: '-2px 0 0 0', fontSize: 12 }}
                    className='uk-text-muted'
                  >
                    This wizard will walk you through importing accounts from a json file.
                  </h5>
                </div>
                <div className='right' style={{ margin: 15 }}>
                  <button className='btn md-btn md-btn-warning js-wizard-cancel' onClick={this.resetWizards}>
                    Cancel
                  </button>
                </div>
                <hr className='nomargin' />
                <form className='uk-form-stacked' id='wizard_json_form'>
                  <div id='wizard_json'>
                    <h3>File Upload</h3>
                    <section>
                      <h2 className='heading-wiz'>
                        File Upload
                        <span className='sub-heading'>Upload json file containing user data to import.</span>
                      </h2>
                      <hr className='md-hr' />
                      <div id='json-upload-drop' className='uk-file-upload'>
                        <p className='uk-text'>Drop file to upload</p>
                        <p className='uk-text-muted uk-text-small uk-margin-small-bottom'>or</p>
                        <a className='uk-form-file md-btn'>
                          choose file
                          <input type='file' id='json-upload-select' />
                        </a>
                      </div>

                      <div id='json-progressbar' className='uk-progress uk-active uk-progress-success uk-hidden'>
                        <div className='uk-progress-bar' style={{ width: 0 }} />
                      </div>
                    </section>
                    <h3>Review Uploaded Data</h3>
                    <section>
                      <h2 className='heading-wiz'>
                        Review Uploaded Data
                        <span className='sub-heading'>Below is the parsed contents of the uploaded csv file.</span>
                      </h2>

                      <textarea className='review-list' id='json-review-list' disabled />
                    </section>
                    <h3>Import Accounts</h3>
                    <section>
                      <h2 className='heading-wiz uk-margin-medium-bottom'>
                        Importing Accounts..
                        <span className='sub-heading'>
                          Please wait while your accounts are imported.
                          <br />
                          <em>Please do not navigate away from this page. Some UI Elements have been disabled.</em>
                        </span>
                      </h2>
                      <div
                        id='json-import-status-box'
                        style={{ width: '100%', height: 300, border: '1px solid #ccc', overflow: 'auto', padding: 10 }}
                      >
                        <ul />
                      </div>
                      <br />
                      <div
                        className='js-json-progress uk-progress uk-progress-striped uk-active uk-progress-success'
                        style={{
                          marginBottom: 0,
                          boxShadow: 'inset 0 0 0 1px rgba(0, 0, 0,.06)',
                          background: '#f4f4f4'
                        }}
                      >
                        <div className='uk-progress-bar' style={{ width: 0 }} />
                      </div>
                    </section>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div id='ldap_wizard_card' ref={this.ldapWizardRef} className='uk-grid uk-margin-small-bottom uk-hidden'>
            <div className='uk-width-1-1'>
              <div
                className='panel trupanel nopadding no-hover-shadow'
                style={{ position: 'relative', minHeight: 265 }}
              >
                <div className='left'>
                  <h6 style={{ padding: '10px 0 0 15px', margin: 0, fontSize: 16 }}>LDAP Account Import Wizard</h6>
                  <h5
                    style={{ padding: '0 0 10px 15px', margin: '-2px 0 0 0', fontSize: 12 }}
                    className='uk-text-muted'
                  >
                    This wizard will walk you through connecting and import users from a LDAP server.
                  </h5>
                </div>
                <div className='right' style={{ margin: 15 }}>
                  <button className='btn md-btn md-btn-warning js-wizard-cancel' onClick={this.resetWizards}>
                    Cancel
                  </button>
                </div>
                <hr className='nomargin' />
                <div className='card-spinner uk-hidden' style={{ opacity: 0.85 }}>
                  <div className='spinner' />
                </div>
                <form action='#' className='uk-form-stacked' id='wizard_ldap_connection_form'>
                  <div id='wizard_ldap'>
                    <h3>Connection Information</h3>
                    <section>
                      <h2 className='heading-wiz'>
                        Connection Information
                        <span className='sub-heading'>
                          To import users from an LDAP server, we need a little connection information.
                        </span>
                      </h2>
                      <hr className='md-hr' style={{ marginTop: '14px !important' }} />

                      <div className='uk-grid'>
                        <div className='uk-margin-large-bottom uk-width-1-3'>
                          <label htmlFor='ldap-server'>LDAP Server</label>
                          <input
                            id='ldap-server'
                            type='text'
                            className='md-input'
                            name='ldap-server'
                            required
                            defaultValue={''}
                          />
                        </div>
                        <div className='uk-margin-large-bottom uk-width-1-3'>
                          <label htmlFor='ldap-bind-dn'>Bind DN (CN=Administrator,DC=domain,DC=com)</label>
                          <input type='text' className='md-input' name='ldap-bind-dn' required defaultValue={''} />
                        </div>
                        <div className='uk-margin-large-bottom uk-width-1-3'>
                          <label htmlFor='ldap-password'>Password</label>
                          <input type='password' className='md-input' name='ldap-password' required defaultValue={''} />
                        </div>
                        <div className='uk-margin-large-bottom uk-width-1-2'>
                          <label htmlFor='ldap-search-base'>Search Base</label>
                          <input type='text' className='md-input' name='ldap-search-base' required defaultValue={''} />
                        </div>
                        <div className='uk-margin-large-bottom uk-width-1-2'>
                          <label htmlFor='ldap-filter'>Search Filter (Defaults to Users)</label>
                          <input
                            type='text'
                            className='md-input'
                            name='ldap-filter'
                            required
                            defaultValue='(&(objectClass=user)(objectCategory=person))'
                          />
                        </div>
                      </div>
                    </section>

                    <h3>Verify Connection</h3>
                    <section>
                      <h2 className='heading-wiz'>
                        Verify Connection
                        <span id='wizard_ldap_verify_text' className='sub-heading'>
                          Please wait while we try to bind to your ldap server...
                        </span>
                      </h2>

                      <div
                        id='wizard_ldap_verify_spinner'
                        className='card-spinner uk-hidden'
                        style={{ background: 'none !important', minHeight: 400 }}
                      >
                        <div className='spinner' />
                      </div>

                      <div id='wizard_ldap_verify_icon' className='md-large-icon md-color-red uk-text-center uk-hidden'>
                        <i className='material-icons'>&#xE86C;</i>
                      </div>
                    </section>
                    <h3>Review Accounts</h3>
                    <section>
                      <h2 className='heading-wiz' style={{ marginBottom: 15 }}>
                        Review Accounts
                        <span className='sub-heading'>
                          Please review the accounts below before proceeding. The next step will import the accounts.
                        </span>
                      </h2>

                      <textarea className='review-list' id='ldap-review-list' disabled />
                    </section>

                    <h3>Import Accounts</h3>
                    <section>
                      <h2 className='heading-wiz uk-margin-medium-bottom'>
                        Importing Accounts..
                        <span className='sub-heading'>
                          Please wait while your accounts are imported.
                          <br />
                          <em>Please do not navigate away from this page. Some UI Elements have been disabled.</em>
                        </span>
                      </h2>
                      <div
                        id='ldap-import-status-box'
                        style={{ width: '100%', height: 300, border: '1px solid #ccc', overflow: 'auto', padding: 10 }}
                      >
                        <ul />
                      </div>
                      <br />
                      <div
                        className='js-ldap-progress uk-progress uk-progress-striped uk-active uk-progress-success'
                        style={{
                          marginBottom: 0,
                          boxShadow: 'inset 0 0 0 1px rgba(0, 0, 0,.06)',
                          background: '#f4f4f4'
                        }}
                      >
                        <div className='uk-progress-bar' style={{ width: 0 }} />
                      </div>
                    </section>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </PageContent>
      </>
    )
  }
}

AccountsImportContainer.propTypes = {}

export default AccountsImportContainer
