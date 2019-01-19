import React from 'react';
import PropTypes from 'prop-types';

import $ from 'jquery';
import UIkit from 'uikit';
import helpers from 'lib/helpers';

class UploadButtonWithX extends React.Component {

    componentDidMount() {
        const $uploadButton = $(this.uploadButton);
        const $buttonX = $(this.buttonX);
        const $uploadSelect = $(this.uploadSelect);

        const uploadLogoSettings = {
            action: this.props.uploadAction,
            allow: this.props.extAllowed,
            loadstart: function () {
                $uploadButton.text('Uploading...');
                $uploadButton.attr('disabled', true);
                $uploadButton.addClass('disable');
            },
            allcomplete: function () {
                $uploadButton.text('Upload Logo');
                $uploadButton.attr('disabled', false);
                $uploadButton.removeClass('disable');
                helpers.UI.showSnackbar('Upload Complete. Reloading...', false);
                // remove page refresh once SettingsService merge
                // $('img.site-logo').attr('src', '/assets/topLogo.png?refresh=' + new Date().getTime());
                setTimeout(function() {
                    window.location.reload();
                }, 1000);
                $buttonX.removeClass('hide');
            }
        };

        UIkit.uploadSelect($uploadSelect, uploadLogoSettings);
    }

    render() {
        const { buttonText, showX, onXClick } = this.props;

        return (
            <div>
                <button ref={x => { this.buttonX = x; }} className={`md-btn md-btn-danger md-btn-small right ${(showX ? '' : 'hide')}`} onClick={onXClick} style={{marginTop: '8px'}}>X</button>
                <button ref={button => { this.uploadButton = button; }} className='uk-form-file md-btn md-btn-small right' style={{marginTop: '8px', textTransform: 'none'}}>
                    {buttonText}
                    <input ref={select => { this.uploadSelect = select; }} type='file' />
                </button>
            </div>
        );
    }
}

UploadButtonWithX.propTypes = {
    buttonText: PropTypes.string.isRequired,
    uploadAction: PropTypes.string.isRequired,
    extAllowed: PropTypes.string.isRequired,
    showX: PropTypes.oneOfType([ PropTypes.bool, PropTypes.string ]),
    onXClick: PropTypes.func
};

export default UploadButtonWithX;