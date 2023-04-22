import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react'
import PropTypes from 'prop-types'

import helpers from '../install-helpers'
import anime from 'animejs'

const Slides = forwardRef(({ children }, ref) => {
  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    helpers.UI.inputs()
    const slides = document.querySelectorAll('.slides > .slide')
    let idx = 0
    slides.forEach(slide => {
      slide.dataset.slide = idx
      slide.classList.add('slide-' + idx)
      if (idx === 0) slide.classList.add('activeSlide')
      // else slide.classList.add('hide')
      idx++
    })
  }, [])

  useImperativeHandle(ref, () => ({
    advanceSlides,
    showSlideWithId
  }))

  const transitionSlide = (active, next) => {
    anime({
      targets: active,
      opacity: [1, 0],
      duration: 300,
      easing: 'easeOutExpo',
      complete: () => {
        active.classList.remove('activeSlide')
        active.classList.add('hide')
        next.classList.remove('hide')
        anime({
          targets: next,
          opacity: [0, 1],
          duration: 300,
          easing: 'easeOutExpo',
          complete: () => {
            next.classList.add('activeSlide')
          }
        })
      }
    })
  }

  const advanceSlides = () => {
    const slides = document.querySelectorAll('.slides > .slide')
    if (activeSlide < slides.length - 1) {
      const aSlide = slides[activeSlide]
      const nSlide = document.querySelector('.slides > .slide-' + (activeSlide + 1))
      setActiveSlide(activeSlide + 1)

      transitionSlide(aSlide, nSlide)
    }
  }

  const showSlideWithId = id => {
    const nextSlide = document.querySelector('.slides > .slide#' + id)
    const activeSlide = document.querySelector('.slides > .slide.activeSlide')
    setActiveSlide(parseInt(nextSlide.dataset.slide))

    transitionSlide(activeSlide, nextSlide)
  }

  return <div className={'slides'}>{children}</div>
})

Slides.propTypes = {
  children: PropTypes.any
}

Slides.displayName = 'Slides'

export default Slides
