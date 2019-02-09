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
 *  Updated:    2/9/19 1:38 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'

import Easymde from 'easymde'

class EasyMDE extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      value: ''
    }
  }

  componentDidMount () {
    this.easymde = new Easymde({
      element: this.element[0],
      forceSync: true,
      minHeight: '220px',
      toolbar: EasyMDE.getMdeToolbarItems(),
      autoDownloadFontAwesome: false
    })

    this.easymde.codemirror.on('change', () => {
      this.onTextareaChanged(this.easymde.value())
    })
  }

  componentDidUpdate () {
    if (this.easymde && this.easymde.value() !== this.state.value) {
      this.easymde.value(this.state.value)
    }
  }

  componentWillUnmount () {
    if (this.easymde) {
      this.easymde.codemirror.off('change')
      this.easymde = null
    }
  }

  static getDerivedStateFromProps (nextProps, state) {
    if (nextProps.defaultValue) {
      if (state.value === '' && nextProps.defaultValue !== state.value) return { value: nextProps.defaultValue }
    }

    return null
  }

  onTextareaChanged (value) {
    this.setState({
      value
    })

    if (this.props.onChange) this.props.onChange(value)
  }

  static getMdeToolbarItems () {
    return [
      {
        name: 'bold',
        action: Easymde.toggleBold,
        className: 'material-icons mi-bold no-ajaxy',
        title: 'Bold'
      },
      {
        name: 'italic',
        action: Easymde.toggleItalic,
        className: 'material-icons mi-italic no-ajaxy',
        title: 'Italic'
      },
      {
        name: 'Title',
        action: Easymde.toggleHeadingSmaller,
        className: 'material-icons mi-title no-ajaxy',
        title: 'Title'
      },
      '|',
      {
        name: 'Code',
        action: Easymde.toggleCodeBlock,
        className: 'material-icons mi-code no-ajaxy',
        title: 'Code'
      },
      {
        name: 'Quote',
        action: Easymde.toggleBlockquote,
        className: 'material-icons mi-quote no-ajaxy',
        title: 'Quote'
      },
      {
        name: 'Generic List',
        action: Easymde.toggleUnorderedList,
        className: 'material-icons mi-list no-ajaxy',
        title: 'Generic List'
      },
      {
        name: 'Numbered List',
        action: Easymde.toggleOrderedList,
        className: 'material-icons mi-numlist no-ajaxy',
        title: 'Numbered List'
      },
      '|',
      {
        name: 'Create Link',
        action: Easymde.drawLink,
        className: 'material-icons mi-link no-ajaxy',
        title: 'Create Link'
      },
      '|',
      {
        name: 'Toggle Preview',
        action: Easymde.togglePreview,
        className: 'material-icons mi-preview no-disable no-mobile no-ajaxy',
        title: 'Toggle Preview'
      }
    ]
  }

  render () {
    setTimeout(() => {
      this.easymde.codemirror.refresh()
    }, 1)
    return <textarea ref={i => (this.element = i)} value={this.state.value} onChange={e => this.onTextareaChanged(e)} />
  }
}

EasyMDE.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  defaultValue: PropTypes.string
}

export default EasyMDE
