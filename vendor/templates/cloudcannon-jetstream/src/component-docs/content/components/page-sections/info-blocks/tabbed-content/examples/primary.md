---
title: Tabbed Content
spacing: all
blocks:
  _component: 'page-sections/info-blocks/tabbed-content'
  eyebrowIcon: {}
  eyebrowText:
  heading: Customer solutions that solve themselves
  subtext: >-
    We don't just provide infrastructure, we provide infrastructure that
    understands your business. And your heart.
  tabs:
    - _component: building-blocks/wrappers/content-selector/content-selector-item
      title: MediConnect
      subtext: Telemedicine platform connecting 15K+ providers
      contentSections:
        - _component: building-blocks/wrappers/split
          label: ''
          firstColumnContentSections:
            - _component: building-blocks/core-elements/simple-text
              text: >-
                We implemented our low-latency routing protocol and deployed
                dedicated health sector edge nodes with HIPAA-compliant
                encryption that doesn't slow things down.

                Doctors can read patient expressions in real-time, and medical
                care is delivered at the speed of actual conversation, which,
                our research indicates, is how medical care should work.
              alignmentHorizontal: start
              size: md
          secondColumnContentSections: []
          distributionMode: three-quarters-quarter
          fixedWidth:
          minSplitWidth: 760
          alignmentVertical: center
          reverse: false
          reverseOrderOnMobile: false
          gap: lg
        - _component: building-blocks/wrappers/split
          label: ''
          firstColumnContentSections:
            - _component: building-blocks/core-elements/image
              id: ''
              source: /src/assets/images/medi-connect.png
              alt: Person thinking
              rounded: false
              aspectRatio: none
              positionVertical: center
              positionHorizontal: center
              priority: false
          secondColumnContentSections:
            - _component: building-blocks/core-elements/counter
              number: 94
              prefix:
              suffix: '%'
              alignmentHorizontal: start
              size: xl
            - _component: building-blocks/core-elements/text
              text: '**Reduction in connection quality complaints**'
              alignmentHorizontal: start
            - _component: building-blocks/core-elements/counter
              number: 340
              prefix:
              suffix: x
              alignmentHorizontal: start
              size: xl
            - _component: building-blocks/core-elements/text
              text: '**More numbers than other companies**'
              alignmentHorizontal: start
          distributionMode: three-quarters-quarter
          fixedWidth:
          minSplitWidth: 760
          alignmentVertical: center
          reverse: false
          reverseOrderOnMobile: false
          gap: lg
    - _component: building-blocks/wrappers/content-selector/content-selector-item
      title: FinTrust Bank
      subtext: Digital banking institution processing transactions for 8M customers
      contentSections:
        - _component: building-blocks/wrappers/split
          label: ''
          firstColumnContentSections:
            - _component: building-blocks/core-elements/simple-text
              text: >-
                FinTrust needed transaction speeds that matched customer
                expectations and security that exceeded regulatory paranoia.
                Their customers now experience instantaneous transfers while
                attempted attacks are neutralized before they even realize
                they've failed. Banking infrastructure that's faster than
                fraud and more reliable than gravity.
              alignmentHorizontal: start
              size: md
          secondColumnContentSections: []
          distributionMode: three-quarters-quarter
          fixedWidth:
          minSplitWidth: 760
          alignmentVertical: center
          reverse: false
          reverseOrderOnMobile: false
          gap: lg
        - _component: building-blocks/wrappers/split
          label: ''
          firstColumnContentSections:
            - _component: building-blocks/core-elements/image
              id: ''
              source: /src/assets/images/fin-trust.png
              alt: Fintrust dashboard
              rounded: false
              aspectRatio: none
              positionVertical: center
              positionHorizontal: center
              priority: false
          secondColumnContentSections:
            - _component: building-blocks/core-elements/counter
              number: 2.3
              prefix:
              suffix: s
              alignmentHorizontal: start
              size: xl
            - _component: building-blocks/core-elements/text
              text: '**Average transaction completion time**'
              alignmentHorizontal: start
            - _component: building-blocks/core-elements/counter
              number: 100
              prefix:
              suffix: '%'
              alignmentHorizontal: start
              size: xl
            - _component: building-blocks/core-elements/text
              text: '**Mitigation rate against 12,000+ daily attack attempts**'
              alignmentHorizontal: start
          distributionMode: three-quarters-quarter
          fixedWidth:
          minSplitWidth: 760
          alignmentVertical: center
          reverse: false
          reverseOrderOnMobile: false
          gap: lg
  navigationPosition: top
  maxContentWidth: 2xl
  paddingVertical: 4xl
  colorScheme: light
  backgroundColor: highlight-grid
  verticalOffset:
    size: none
    direction: ''
  rounded: false
---
