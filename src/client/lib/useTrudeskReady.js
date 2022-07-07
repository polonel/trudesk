import { useEffect } from 'react'
import $ from 'jquery'

export default function useTrudeskReady (callback) {
  useEffect(() => {
    $(window).on('trudesk:ready', () => {
      if (typeof callback === 'function') return callback()
    })
  }, [])
}
