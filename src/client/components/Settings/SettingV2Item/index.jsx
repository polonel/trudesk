import React, { useEffect } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { IconContext } from 'react-icons'

import * as FiIcons from 'react-icons/fi'
import * as MdIcons from 'react-icons/md'
import * as AiIcons from 'react-icons/ai'
import * as TbIcons from 'react-icons/tb'
import * as BsIcons from 'react-icons/bs'
import * as BiIcons from 'react-icons/bi'
import * as CgIcons from 'react-icons/cg'
import * as LuIcons from 'react-icons/lu'

import RequestersIcon from 'containers/SettingsV2/icons/RequestersIcon'

const DynamicIcon = ({ pkg, name, style }) => {
  let IconComponent = <div />
  const pkgLower = pkg.toLowerCase()

  switch (pkgLower) {
    case 'fi':
      IconComponent = FiIcons[pkg + name]
      break
    case 'md':
      IconComponent = MdIcons[pkg + name]
      break
    case 'ai':
      IconComponent = AiIcons[pkg + name]
      break
    case 'tb':
      IconComponent = TbIcons[pkg + name]
      break
    case 'bs':
      IconComponent = BsIcons[pkg + name]
      break
    case 'bi':
      IconComponent = BiIcons[pkg + name]
      break
    case 'cg':
      IconComponent = CgIcons[pkg + name]
      break
    case 'lu':
      IconComponent = LuIcons[pkg + name]
      break
    default:
      IconComponent = MdIcons['MdQuestionMark']
  }

  return <IconComponent style={style} />
}

const SettingV2Item = props => {
  return (
    <>
      <li>
        <Link to={props.url}>
          <div className={'settings-item-icon'}>
            {props.specialIcon === 'requesters' && <RequestersIcon />}
            {props.iconElement && (
              <IconContext.Provider value={{ className: props.iconClass }}>{props.iconElement}</IconContext.Provider>
            )}
            {props.iconPackage && props.icon && (
              <IconContext.Provider value={{ className: props.iconClass }}>
                <DynamicIcon name={props.icon} pkg={props.iconPackage} style={{ width: 24, height: 24 }} />
              </IconContext.Provider>
            )}
          </div>
          <div>
            <span className={'settings-item-header'}>
              {props.title}
              {props.showNewBadge && <span className={'settings-badge-new'}>New</span>}
              {props.showBetaBadge && <span className={'settings-badge-beta'}>Beta</span>}
            </span>
            <p className={'settings-item-content'}>{props.description}</p>
          </div>
        </Link>
      </li>
    </>
  )
}

SettingV2Item.propTypes = {
  url: PropTypes.string.isRequired,
  iconClass: PropTypes.string,
  iconElement: PropTypes.element,
  iconPackage: PropTypes.string,
  icon: PropTypes.string,
  title: PropTypes.string.isRequired,
  showNewBadge: PropTypes.bool,
  showBetaBadge: PropTypes.bool,
  description: PropTypes.string.isRequired,
  specialIcon: PropTypes.string
}

SettingV2Item.defaultProps = {
  showNewBadge: false,
  showBetaBadge: false
}

export default SettingV2Item
