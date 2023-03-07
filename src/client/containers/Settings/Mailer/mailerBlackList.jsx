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
 *  Updated:    3/3/19 1:03 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { updateSetting } from 'actions/settings';
import { observer } from 'mobx-react';
import { makeObservable, observable } from 'mobx';
import { showModal, hideModal } from 'actions/common';
import Log from '../../../logger';
import axios from 'axios';

import Button from 'components/Button';
import SettingItem from 'components/Settings/SettingItem';
import EnableSwitch from 'components/Settings/EnableSwitch';
import SplitSettingsPanel from 'components/Settings/SplitSettingsPanel';
import IssuePartialHTML from 'containers/Settings/Mailer/IssuePartialHTML';

import helpers from 'lib/helpers';
import Zone from 'components/ZoneBox/zone';
import ZoneBox from 'components/ZoneBox';

const templateBody = ({ template, handleSaveSubject, handleOpenEditor }) => (
  <div>
    <h3 className={'font-light mb-5'}>Template Description</h3>
    <p className="mb-10" style={{ fontSize: '13px' }}>
      {template.description}
    </p>
    <hr className="uk-margin-medium-bottom" />
    <form onSubmit={handleSaveSubject}>
      <input name={'id'} type="hidden" value={template._id} />
      <div className="uk-input-group">
        <div className="md-input-wrapper">
          <label>Mail Subject</label>
          <input name={'subject'} type="text" className={'md-input'} defaultValue={template.subject} />
        </div>
        <span className="uk-input-group-addon">
          <div type={'submit'} text={'Save'} className="md-btn md-btn-small" />
        </span>
      </div>
    </form>

    <Zone extraClass={'uk-margin-medium-top'}>
      <ZoneBox>
        <div className={'uk-float-left'}>
          <h6 style={{ margin: 0, fontSize: '16px', lineHeight: '14px' }}>Edit Template</h6>
          <h5 className={'uk-text-muted'} style={{ margin: '2px 0 0 0', fontSize: '12px' }}>
            Customize template
          </h5>
        </div>
        <div className="uk-float-right uk-width-1-3 uk-clearfix">
          <div className="uk-width-1-1 uk-float-right" style={{ textAlign: 'right' }}>
            {/* <button
              className={'md-btn md-btn-small right disabled'}
              style={{ textTransform: 'none' }}
              onClick={handleOpenEditor}
              disabled={false}
            > */}
            <div>
              <IssuePartialHTML templateId={template._id} />
            </div>
            {/* Open Editor */}
            {/* </button> */}
          </div>
        </div>
      </ZoneBox>
    </Zone>
  </div>
);

templateBody.propTypes = {
  template: PropTypes.object.isRequired,
  handleSaveSubject: PropTypes.func.isRequired,
  handleOpenEditor: PropTypes.func.isRequired,
};

@observer
class MailerSettingsBlackList extends React.Component {
  @observable betaEnabled = false;
  @observable templates = [];

  constructor(props) {
    super(props);
    makeObservable(this);
  }

  componentDidMount() {
    helpers.UI.inputs();
  }

  componentDidUpdate(prevProps) {
    helpers.UI.reRenderInputs();
    if (prevProps.settings !== this.props.settings) {
      if (this.betaEnabled !== this.getSetting('emailBeta')) this.betaEnabled = this.getSetting('emailBeta');
      if (this.props.settings.get('mailTemplates').toArray() !== this.templates) {
        this.templates = this.props.settings.get('mailTemplates').toArray();
      }
    }
  }

  getSetting(name) {
    return this.props.settings.getIn(['settings', name, 'value']) !== undefined
      ? this.props.settings.getIn(['settings', name, 'value'])
      : '';
  }

  onEmailBetaChange(e) {
    const self = this;
    const val = e.target.checked;
    this.props.updateSetting({ name: 'beta:email', value: val, stateName: 'betaEmail', noSnackbar: true }).then(() => {
      self.betaEnabled = val;
    });
  }

  onSaveSubject(e) {
    e.preventDefault();
    const subject = e.target.subject;
    if (!subject) return;
    axios
      .put(`/api/v1/settings/mailer/template/${e.target.id.value}`, {
        subject: subject.value,
      })
      .then((res) => {
        if (res.data && res.data.success) helpers.UI.showSnackbar('Template subject saved successfully');
      })
      .catch((error) => {
        const errorText = error.response ? error.response.error : error;
        helpers.UI.showSnackbar(`Error: ${errorText}`, true);
        Log.error(errorText, error);
      });
  }

  static onOpenEditor(e, name) {
    e.preventDefault();
    const url = `/settings/editor/${name}/`;
    History.pushState(null, null, url);
  }

  mapTemplateMenu() {
    return this.templates.map((template, idx) => {
      const templateJS = template.toJS();
      return {
        key: idx,
        title: template.get('displayName'),
        bodyComponent: templateBody({
          template: templateJS,
          handleSaveSubject: (e) => this.onSaveSubject(e),
          handleOpenEditor: (e) => MailerSettingsBlackList.onOpenEditor(e, templateJS.name),
        }),
      };
    });
  }

  render() {
    const mappedValues = this.mapTemplateMenu();
    return (
      <div>
        <SettingItem
          title={'Blacklist email'}
          subtitle={
            <div>
              Adding an email to the blacklist so that trudesk does not process emails from these email addresses
            </div>
          }
          component={
            <div className={'right uk-width-1-3'} style={{ position: 'relative', paddingTop: 5 }}>
              <div
                className={'uk-float-left'}
                style={{ paddingRight: 25, minWidth: 130, width: '100%', paddingTop: 5 }}
              >
                <button
                  className={'uk-float-right md-btn md-btn-small  md-btn-wave  undefined waves-effect waves-button'}
                  type={'button'}
                  style={{ maxHeight: 27 }}
                  onClick={() => this.props.showModal('SHOW_BLACKLIST')}
                >
                  <div className={`uk-float-left uk-width-1-1 uk-text-center`}> Open list </div>
                </button>
              </div>
            </div>
          }
        />
      </div>
    );
  }
}

MailerSettingsBlackList.propTypes = {
  updateSetting: PropTypes.func.isRequired,
  settings: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({
  settings: state.settings.settings,
});

export default connect(mapStateToProps, { updateSetting, showModal, hideModal })(MailerSettingsBlackList);
