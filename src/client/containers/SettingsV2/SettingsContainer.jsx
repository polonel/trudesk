import React from 'react'
import PageContent from 'components/PageContent'
import TitleContext from 'app/TitleContext'
import { Helmet } from 'react-helmet-async'
import SettingV2Item from 'components/Settings/SettingV2Item'

import menuItems from './settingsmenuitems'

import './settingsv2.sass'
import './settings-icons.sass'

class SettingsContainer extends React.Component {
  render () {
    return (
      <div>
        <TitleContext.Consumer>
          {({ title }) => (
            <Helmet>
              <title>{title} Settings</title>
            </Helmet>
          )}
        </TitleContext.Consumer>
        <PageContent>
          {menuItems.map(parentItem => {
            return (
              <div key={parentItem.title} className={'settings-section'}>
                <div style={{ paddingLeft: 30, marginBottom: 15 }}>
                  <h2>{parentItem.title}</h2>
                  <h6>{parentItem.subtitle}</h6>
                </div>
                <div className={'settings-item-container'}>
                  <ul className={'m-0'}>
                    {parentItem.items.map(item => {
                      if (item.header) {
                        return (
                          <h2
                            key={parentItem.title + '_' + item.title}
                            className={'sub-section'}
                            style={{ flexGrow: 1, width: '100%', marginLeft: 0 }}
                          >
                            {item.title}
                          </h2>
                        )
                      }

                      return (
                        <SettingV2Item
                          key={item.url + '_' + item.title}
                          description={item.description}
                          title={item.title}
                          url={item.url}
                          icon={item.icon}
                          iconPackage={item.iconPackage}
                          iconClass={item.iconClass}
                          showBetaBadge={item.betaBadge}
                          showNewBadge={item.newBadge}
                          specialIcon={item.specialIcon}
                        />
                      )
                    })}
                  </ul>
                </div>
              </div>
            )
          })}
        </PageContent>
      </div>
    )
  }
}

SettingsContainer.propTypes = {}

export default SettingsContainer
