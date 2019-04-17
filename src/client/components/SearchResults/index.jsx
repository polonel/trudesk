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
 *  Updated:    4/16/19 11:48 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import sanitizeHtml from 'sanitize-html'

import { unloadSearchResults } from 'actions/search'

import $ from 'jquery'
import helpers from 'lib/helpers'

class SearchResults extends React.Component {
  componentDidMount () {
    helpers.UI.setupDataTethers()
    $(document).on('mousedown', SearchResults.documentMouseEvent)
  }

  componentDidUpdate () {}

  componentWillUnmount () {
    SearchResults.toggleAnimation(true, false)
    $(document).off('mousedown', SearchResults.documentMouseEvent)
  }

  static documentMouseEvent (event) {
    const $target = $(event.target)
    const isInContainer = $target.parents('.search-results-container').length > 0
    if (isInContainer) return false

    SearchResults.toggleAnimation(true, false)
  }

  static toggleAnimation (forceState, state) {
    const animateItems = $('.search-results-container')
    const docElemStyle = document.documentElement.style
    const transitionProp = angular.isString(docElemStyle.transition) ? 'transition' : 'WebkitTransition'

    for (let i = 0; i < animateItems.length; i++) {
      const item = animateItems[i]
      item.style[transitionProp + 'Delay'] = i * 50 + 'ms'

      if (forceState) {
        if (state) {
          item.classList.remove('hide')
          item.classList.add('is-in')
        } else {
          item.classList.add('hide')
          item.classList.remove('is-in')
        }
      } else {
        item.classList.toggle('hide')
        item.classList.toggle('is-in')
      }
    }
  }

  onSearchItemClick (e) {
    e.preventDefault()
    SearchResults.toggleAnimation(true, false)
    const href = e.currentTarget.getAttribute('href')
    History.pushState(null, null, href)
    this.props.unloadSearchResults()
  }

  render () {
    const { target, searchResults, error } = this.props
    return (
      <div
        className={'search-results-container animate-in'}
        data-tether={`{target: '${target}', pos: 'top right', targetAttachment: 'bottom right', offset: '0 8px'}`}
      >
        {error && <h4 className={'uk-width-1-1 uk-text-center text-light mt-15 text-danger'}>{error.error}</h4>}
        {!searchResults ||
          (searchResults.size < 1 && <h4 className={'uk-width-1-1 uk-text-center text-light mt-15'}>No Results</h4>)}
        <ul className={'search-results-list'}>
          {searchResults &&
            searchResults.map(item => {
              const doc = item.get('_source')
              return (
                <li key={item.get('_id')} className={`search-results-item status-${doc.get('status')}`}>
                  <a href={`/tickets/${doc.get('uid')}`} onClick={e => this.onSearchItemClick(e)}>
                    <span className='priority' style={{ background: `${doc.getIn(['priority', 'htmlColor'])}` }} />
                    <span className='uid'>{doc.get('uid')}</span>
                    <span className='subject'>{doc.get('subject')}</span>
                    <span className='issue'>{sanitizeHtml(doc.get('issue'), { allowedTags: [] })}</span>
                  </a>
                </li>
              )
            })}
        </ul>
      </div>
    )
  }
}

SearchResults.propTypes = {
  target: PropTypes.string.isRequired,
  searchResults: PropTypes.object.isRequired,
  error: PropTypes.object,
  unloadSearchResults: PropTypes.func.isRequired
}

const mapStateToProps = state => ({
  searchResults: state.searchState.results,
  error: state.searchState.error
})

export default connect(
  mapStateToProps,
  { unloadSearchResults },
  null,
  { forwardRef: true }
)(SearchResults)
