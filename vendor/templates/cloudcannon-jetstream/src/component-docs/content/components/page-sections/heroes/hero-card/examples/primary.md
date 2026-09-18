---
title: Hero Card
spacing: all
blocks:
  _component: 'page-sections/heroes/hero-card'
  eyebrowIcon:
    _component: building-blocks/core-elements/icon
    name: newspaper
    size: 3xl
    color: brand-gradient
    background: true
    iconOffset: true
    alignmentHorizontal: start
  heading: The engineering journal
  subtext: >-
    Insights, updates, and occasional technical deep-dives from the team that
    keeps the internet running.
  maxContentWidth: 2xl
  paddingVertical: none
  backgroundColor: base
  colorScheme: light
  card:
    eyebrowText:
    heading: >-
      <h1><strong>Why we rebuilt our DNS resolver from scratch (</strong><span
      class="highlight-text"><strong>again</strong></span><strong>)</strong>
      </h1>
    subtext: >-
      Sometimes good enough isn't good enough, especially when our engineers
      have strong opinions about query optimization.
    image:
      source: /src/assets/images/blog-dns-resolver.png
      alt: >-
        There seems no limit to what the printed circuit could have told you
        (if you had tried to find out); a revelation  trembles just past the
        threshold of your understanding.
      rounded: true
    buttonSections:
      - _component: building-blocks/core-elements/button
        text: Learn why we did it
        hideText: false
        link: /blog/why-we-rebuilt-our-dns-resolver-from-scratch-again
        iconName: arrow-right
        iconPosition: after
        variant: secondary
        size: md
    counters:
      - counter:
          number: 47
          prefix:
          suffix: ms
        subtext: Previous resolver response time (unacceptable)
      - counter:
          number: 1.2
          prefix:
          suffix: ms
        subtext: New resolver response time (acceptable)
      - counter:
          number: 840
          prefix:
          suffix: K+
        subtext: Lines of code written, deleted, rewritten
      - counter:
          number: 3
          prefix:
          suffix:
        subtext: All-hands meetings to convince management
    usePost: false
---
