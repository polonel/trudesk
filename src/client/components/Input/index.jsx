import React from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import { observable } from 'mobx'

import helpers from 'lib/helpers'

@observer
class Input extends React.Component {
  @observable value = ''

  constructor (props) {
    super(props)
  }

  componentDidMount () {
    helpers.UI.inputs()
  }

  handleChange = e => {
    this.value = e.target.value
    if (this.props.onChange) this.props.onChange(this.value)
  }

  render () {
    const { id, name, type, defaultValue, showLabel, labelText, innerRef } = this.props
    const ariaLabel = showLabel ? undefined : labelText
    return (
      <div>
        {showLabel && <label htmlFor={id}>{labelText}</label>}
        <input
          ref={innerRef}
          className={'md-input'}
          id={id}
          name={name}
          type={type}
          defaultValue={defaultValue}
          onChange={e => this.handleChange(e)}
          aria-label={ariaLabel}
        />
      </div>
    )
  }
}

Input.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string,
  type: PropTypes.string,
  defaultValue: PropTypes.string,
  onChange: PropTypes.func,
  showLabel: PropTypes.bool,
  labelText: PropTypes.string,
  innerRef: PropTypes.any
}

Input.defaultProps = {
  type: 'text',
  showLabel: false
}

export default Input
