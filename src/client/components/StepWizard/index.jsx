import React, { createRef } from 'react'
import PropTypes from 'prop-types'
import { union } from 'lodash'
import clsx from 'clsx'

import velocity from 'velocity'
import helpers from 'lib/helpers'
import 'jquery_steps'
import 'jquery_actual'
import $ from 'jquery'
import UIKit from 'uikit'
import socket from 'lib/socket'

class StepWizard extends React.Component {
  constructor (props) {
    super(props)

    this.hasUploaded = false

    this.container = createRef()
    this.wizard = createRef()
    this.statusBox = createRef()

    this.init = this.init.bind(this)
    this.show = this.show.bind(this)
    this.hide = this.hide.bind(this)
  }

  componentDidMount () {
    this.init()
  }

  init = () => {
    if (!this.wizard.current) return

    const wizard = $(this.wizard.current)

    wizard.steps({
      headerTag: 'h3',
      bodyTag: 'section',
      transitionEffect: 'slideLeft',
      trigger: 'change',
      cssClass: 'wizard wizard-green',
      onInit: (event, currentIndex) => {
        this.setContentHeight(wizard, currentIndex)

        wizard
          .find('.button_next')
          .addClass('disabled')
          .attr('aria-disabled', true)
          .find('a')
          .attr('disabled', true)

        setTimeout(() => {
          $(window).resize()
        }, 100)
      },
      onStepChanging: (event, currentIndex, newIndex) => {
        if (currentIndex === 0 && newIndex === 1) {
          if (!this.hasUploaded) {
            return false
          }
        }
        return true
      },
      onStepChanged: (event, currentIndex) => {
        if (currentIndex === 2) {
          wizard.find('.steps ul li').each(() => {
            $(this).addClass('disabled')
          })

          wizard.find('.actions ul li').addClass('disabled')
          wizard
            .find('.button_previous')
            .addClass('disabled')
            .attr('aria-disabled', true)
          const statusBox = $(this.statusBox.current)
          const statusUL = statusBox.find('ul')
          statusUL.append('<li>Starting Import...</li>')

          this.disableUIElements()

          setTimeout(() => {
            // Importing...
            socket.accountsImporter.sendAccountData('csv', this.addedUsers, this.updatedUsers)
          }, 1000)
        }

        $('.steps .current')
          .nextAll()
          .removeClass('done')
          .addClass('disabled')

        this.setContentHeight(wizard, currentIndex)
      },
      onFinished: () => {
        console.log('DONE')
      }
    })

    // Loading Settings
    const progressbar = wizard.find('#progressbar')
    const bar = progressbar.find('.uk-progress-bar')
    const self = this

    const settings = {
      action: '/accounts/import/csv/upload',
      allow: '*.csv',
      loadstart: () => {
        bar.css('width', '0%').text('0%')
        progressbar.removeClass('uk-hidden')
      },
      progress: percent => {
        percent = Math.ceil(percent)
        bar.css('width', percent + '%').text(percent + '%')
      },
      notallowed: () => {
        helpers.UI.showSnackbar('Invalid File Type. Please upload a CSV file.', true)
      },
      error: err => {
        console.error(err)
        helpers.UI.showSnackbar('An unknown error occurred. Check Console', true)
      },
      allcomplete: response => {
        response = JSON.parse(response)
        if (!response.success) {
          console.log(response)
          helpers.UI.showSnackbar('An Error occurred. Check Console', true)
          return false
        }

        self.hasUploaded = true
        // state.csvData = response.contents
        self.addedUsers = response.addedUsers
        self.updatedUsers = response.updatedUsers

        wizard.find('.review-list').val(self.reviewRender(response.addedUsers, response.updatedUsers))

        bar.css('width', '100%').text('100%')

        setTimeout(function () {
          progressbar.addClass('uk-hidden')

          wizard.steps('setStep', 1)
        }, 1000)

        // helpers.UI.showSnackbar('Upload Complete', false);
      }
    }

    UIKit.uploadSelect(wizard.find('#upload-select'), settings)
    UIKit.uploadDrop(wizard.find('#upload-drop'), settings)
  }

  show = () => {
    if (!this.container.current) return

    this.container.current.classList.remove('uk-hidden')
  }

  hide = () => {
    if (!this.container.current) return

    this.container.current.classList.add('uk-hidden')
  }

  onCancelClicked = e => {
    if (typeof this.props.onCancelClicked === 'function') this.props.onCancelClicked(e)
  }

  setContentHeight (thisWizard, step) {
    const thisHeight = $(thisWizard)
      .find('.step-' + step)
      .actual('outerHeight')
    $(thisWizard)
      .children('.content')
      .velocity({ height: thisHeight }, { duration: 140, easing: [0.215, 0.61, 0.355, 1] })
  }

  disableUIElements = () => {
    $('.sidebar').css({ width: 0 })
    $('.side-nav-bottom-panel').css({ width: 0 })
    $('#page-content').css({ marginLeft: 0 })
    $('.top-menu').css({ display: 'none' })
    $('.js-wizard-select-wrapper').css({ display: 'none' })
    $('.js-wizard-cancel').css({ display: 'none' })
  }

  reviewRender (addedUsers, updatedUsers) {
    const addedUsersTemplate = []
    const updatedUsersTemplate = []

    if (addedUsers === null) addedUsers = []
    if (updatedUsers === null) updatedUsers = []

    for (let i = 0; i < addedUsers.length; i++) {
      addedUsersTemplate.push(
        addedUsers[i].username +
          ' | action=add username=' +
          addedUsers[i].username +
          ' name=' +
          addedUsers[i].fullname +
          ' email=' +
          addedUsers[i].email +
          ' title=' +
          addedUsers[i].title
      )
    }

    for (let k = 0; k < updatedUsers.length; k++) {
      updatedUsersTemplate.push(
        updatedUsers[k].username +
          ' | action=update username=' +
          updatedUsers[k].username +
          ' name=' +
          updatedUsers[k].fullname +
          ' email=' +
          updatedUsers[k].email +
          ' title=' +
          updatedUsers[k].title
      )
    }

    const sep = []

    if (addedUsersTemplate.length > 0) {
      sep.push('----------------')
    }

    return union(addedUsersTemplate, sep, updatedUsersTemplate).join('\r')
  }

  render () {
    const { title, subtitle, cancelButtonText } = this.props

    return (
      <div ref={this.container} className='uk-grid uk-margin-small-bottom uk-hidden'>
        <div className='uk-width-1-1'>
          <div className='panel trupanel nopadding no-hover-shadow' style={{ position: 'relative', minHeight: 265 }}>
            <div className='left'>
              <h6 style={{ padding: '10px 0 0 15px', margin: 0, fontSize: 16 }}>{title}</h6>
              <h5 style={{ padding: '0 0 10px 15px', margin: '-2px 0 0 0', fontSize: 12 }} className='uk-text-muted'>
                {subtitle}
              </h5>
            </div>
            <div className='right' style={{ margin: 15 }}>
              <button className='btn md-btn md-btn-warning js-wizard-cancel' onClick={e => this.onCancelClicked(e)}>
                {cancelButtonText}
              </button>
            </div>
            <hr className='nomargin' />
            <form className='uk-form-stacked' id='wizard_csv_form'>
              <div ref={this.wizard}>
                <h3>File Upload</h3>
                <section>
                  <h2 className='heading-wiz'>
                    File Upload
                    <span className='sub-heading'>Upload csv file containing user data to import.</span>
                  </h2>
                  <hr className='md-hr' />
                  <div id='upload-drop' className='uk-file-upload'>
                    <p className='uk-text'>Drop file to upload</p>
                    <p className='uk-text-muted uk-text-small uk-margin-small-bottom'>or</p>
                    <button className='uk-form-file md-btn'>
                      choose file
                      <input type='file' id='upload-select' />
                    </button>
                  </div>

                  <div id='progressbar' className='uk-progress uk-active uk-progress-success uk-hidden'>
                    <div className='uk-progress-bar' style={{ width: 0 }} />
                  </div>
                </section>
                <h3>Review Uploaded Data</h3>
                <section>
                  <h2 className='heading-wiz'>
                    Review Uploaded Data
                    <span className='sub-heading'>Below is the parsed contents of the uploaded csv file.</span>
                  </h2>
                  <textarea className='review-list' disabled={true} />
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
                    ref={this.statusBox}
                    style={{ width: '100%', height: 300, border: '1px solid #ccc', overflow: 'auto', padding: 10 }}
                  >
                    <ul />
                  </div>
                  <br />
                  <div
                    className='js-csv-progress uk-progress uk-progress-striped uk-active uk-progress-success'
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
    )
  }
}

StepWizard.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string.isRequired,
  cancelButtonText: PropTypes.string,
  onCancelClicked: PropTypes.func
}

StepWizard.defaultProps = {
  cancelButtonText: 'Cancel',
  onCancelClicked: () => {}
}

export default StepWizard
