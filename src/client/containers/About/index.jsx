import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { hideModal, showModal, fetchReleases } from 'actions/common'

import helpers from 'lib/helpers'
import PageContent from 'components/PageContent'
import clsx from 'clsx'
import PageTitle from 'components/PageTitle'
import Spinner from 'components/SpinLoader'
import { Helmet } from 'react-helmet-async'
import TitleContext from 'app/TitleContext'

class AboutContainer extends React.Component {
  componentDidMount () {
    this.props.fetchReleases()
    helpers.setupScrollers()
    helpers.UI.waves()
  }

  // eslint-disable-next-line no-unused-vars,@typescript-eslint/no-unused-vars
  componentDidUpdate (prevProps, prevState, snapshot) {
    helpers.resizeAll()
  }
  render () {
    return (
      <>
        <TitleContext.Consumer>
          {({ title }) => (
            <Helmet>
              <title>{title} About</title>
            </Helmet>
          )}
        </TitleContext.Consumer>
        <PageContent extraClass={clsx('bt', 'about-section')} padding={0} paddingBottom={50}>
          <PageTitle title={'About'} shadow={false} />
          <section style={{ margin: '15px 25px' }}>
            <div
              className={'mt-5 banner'}
              style={{
                width: '100%',
                display: 'flex',
                padding: '15px',
                background: 'var(--tertiaryfade25)',
                border: '1px solid var(--tertiary)',
                borderRadius: 5,
                alignItems: 'center'
              }}
            >
              <i className='material-icons' style={{ marginRight: 10 }}>
                info
              </i>
              <span style={{ fontSize: '1.1rem', flexGrow: 1 }}>
                This is BETA software. Some features may be broken and/or unstable. Please report any issues to Github!!
              </span>
              <a
                href='https://github.com/polonel/trudesk/issues'
                target={'_blank'}
                rel={'noreferrer noopener'}
                style={{ fontSize: '1.1rem', color: 'var(--primary)' }}
              >
                Github ➜
              </a>
            </div>
          </section>
          <section>
            <dl>
              <div>
                <dt>Version</dt>
                <dd>
                  <span>
                    <code>1.2.2</code>
                    <code>CE</code>
                    <a
                      href='https://github.com/polonel/trudesk/releases'
                      className={'up-to-date'}
                      target={'_blank'}
                      rel={'noreferrer noopener'}
                    >
                      <span>Up to Date</span>
                    </a>
                  </span>
                </dd>
              </div>
            </dl>

            <dl>
              <div>
                <dt>Release Channel</dt>
                <dd>
                  <span>
                    <code>stable</code>
                  </span>
                </dd>
              </div>
            </dl>

            <dl>
              <div>
                <dt>Total Tickets</dt>
                <dd>
                  <span className={'text'}>12,568</span>
                </dd>
              </div>
            </dl>
            <dl>
              <div>
                <dt>Total Customers</dt>
                <dd>
                  <span className={'text'}>34</span>
                </dd>
              </div>
            </dl>
            <dl>
              <div>
                <dt>Total Customers</dt>
                <dd>
                  <span className={'text'}>34</span>
                </dd>
              </div>
            </dl>
          </section>

          <PageTitle title={'Getting Support'} extraClasses={'mt-50'} />
          <section>
            <dl>
              <div>
                <dt>Documentation</dt>
                <dd>
                  <span className={'text'}>
                    <a href='https://docs.trudesk.io/v1.2' target={'_blank'} rel={'noreferrer noopener'}>
                      https://docs.trudesk.io/v1.2
                    </a>
                  </span>
                </dd>
              </div>
            </dl>
            <dl>
              <div>
                <dt>Github Issues</dt>
                <dd>
                  <span className={'text'}>
                    <a href='https://github.com/polonel/trudesk/issues' target={'_blank'} rel={'noreferrer noopener'}>
                      https://github.com/polonel/trudesk/issues
                    </a>
                  </span>
                </dd>
              </div>
            </dl>
          </section>

          <PageTitle title={'Support Trudesk'} extraClasses={'mt-50'} />
          <section>
            <dl>
              <div>
                <dt>Help pay for a cup of coffee</dt>
                <dd>
                  <span className={'text'}>
                    <a href='https://github.com/sponsors/polonel' target={'_blank'} rel={'noreferrer noopener'}>
                      https://github.com/sponsors/polonel
                    </a>
                  </span>
                </dd>
              </div>
            </dl>
          </section>

          <PageTitle title={'Releases'} extraClasses={'mt-50'} />
          <section className={'releases'}>
            {this.props.releases.loading && (
              <div
                style={{
                  display: 'flex',
                  width: '100%',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}
              >
                <Spinner active={true} style={{ top: 50 }} />
              </div>
            )}
            {!this.props.releases.loading &&
              this.props.releases.data.map(release => (
                <div key={release.get('id')}>
                  <div className={'release-item'}>
                    <div className={'release-text'}>
                      <span>
                        <span>{release.get('duration_format')}</span>
                        {release.get('name')}
                      </span>
                    </div>
                    <button
                      className={'md-btn md-btn-primary md-btn-wave'}
                      onClick={() => {
                        this.props.showModal('VIEW_CHANGELOG', {
                          content: release.get('body'),
                          link: release.get('html_url')
                        })
                      }}
                    >
                      <i className={'material-icons'}>assignment</i>
                      View Changelog
                    </button>
                  </div>
                </div>
              ))}
          </section>
        </PageContent>
      </>
    )
  }
}

AboutContainer.propTypes = {
  showModal: PropTypes.func.isRequired,
  hideModal: PropTypes.func.isRequired,
  fetchReleases: PropTypes.func.isRequired,
  viewdata: PropTypes.object.isRequired,
  releases: PropTypes.object.isRequired
}

const mapStateToProps = state => ({
  viewdata: state.common.viewdata,
  releases: state.releases
})

export default connect(mapStateToProps, { fetchReleases, showModal, hideModal })(AboutContainer)
