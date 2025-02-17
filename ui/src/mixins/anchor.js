import { clearSelection } from '../utils/selection.js'
import { prevent, listenOpts } from '../utils/event.js'

const { passive, notPassive } = listenOpts

export default {
  props: {
    target: {
      type: [Boolean, String],
      default: true
    },
    noParentEvent: Boolean,
    contextMenu: Boolean
  },

  watch: {
    contextMenu (val) {
      if (this.anchorEl !== void 0) {
        this.__unconfigureAnchorEl(!val)
        this.__configureAnchorEl(val)
      }
    },

    target () {
      if (this.anchorEl !== void 0) {
        this.__unconfigureAnchorEl()
      }

      this.__pickAnchorEl()
    },

    noParentEvent (val) {
      if (this.anchorEl !== void 0) {
        if (val === true) {
          this.__unconfigureAnchorEl()
        }
        else {
          this.__configureAnchorEl()
        }
      }
    }
  },

  methods: {
    __showCondition (evt) {
      // abort with no parent configured or on multi-touch
      if (this.anchorEl === void 0) {
        return false
      }
      if (evt === void 0) {
        return true
      }
      return evt.touches === void 0 || evt.touches.length <= 1
    },

    __contextClick (evt) {
      this.hide(evt)
      this.$nextTick(() => {
        this.show(evt)
      })
      prevent(evt)
    },

    __toggleKey (evt) {
      if (evt !== void 0 && evt.keyCode === 13 && evt.qKeyEvent !== true) {
        this.toggle(evt)
      }
    },

    __mobileTouch (evt) {
      this.__mobileCleanup(evt)

      if (this.__showCondition(evt) !== true) {
        return
      }

      this.hide(evt)
      this.anchorEl.classList.add('non-selectable')

      this.touchTimer = setTimeout(() => {
        this.show(evt)
      }, 300)
    },

    __mobileCleanup (evt) {
      this.anchorEl.classList.remove('non-selectable')
      clearTimeout(this.touchTimer)

      if (this.showing === true && evt !== void 0) {
        clearSelection()
      }
    },

    __unconfigureAnchorEl (context = this.contextMenu) {
      if (context === true) {
        if (this.$q.platform.is.mobile === true) {
          this.anchorEl.removeEventListener('touchstart', this.__mobileTouch, passive)
          ;['touchcancel', 'touchmove', 'touchend'].forEach(evt => {
            this.anchorEl.removeEventListener(evt, this.__mobileCleanup, passive)
          })
        }
        else {
          this.anchorEl.removeEventListener('click', this.hide, passive)
          this.anchorEl.removeEventListener('contextmenu', this.__contextClick, notPassive)
        }
      }
      else {
        this.anchorEl.removeEventListener('click', this.toggle, passive)
        this.anchorEl.removeEventListener('keyup', this.__toggleKey, passive)
      }
    },

    __configureAnchorEl (context = this.contextMenu) {
      if (this.noParentEvent === true) { return }

      if (context === true) {
        if (this.$q.platform.is.mobile === true) {
          this.anchorEl.addEventListener('touchstart', this.__mobileTouch, passive)
          ;['touchcancel', 'touchmove', 'touchend'].forEach(evt => {
            this.anchorEl.addEventListener(evt, this.__mobileCleanup, passive)
          })
        }
        else {
          this.anchorEl.addEventListener('click', this.hide, passive)
          this.anchorEl.addEventListener('contextmenu', this.__contextClick, notPassive)
        }
      }
      else {
        this.anchorEl.addEventListener('click', this.toggle, passive)
        this.anchorEl.addEventListener('keyup', this.__toggleKey, passive)
      }
    },

    __setAnchorEl (el) {
      this.anchorEl = el
      while (this.anchorEl.classList.contains('q-anchor--skip')) {
        this.anchorEl = this.anchorEl.parentNode
      }
      this.__configureAnchorEl()
    },

    __pickAnchorEl () {
      if (this.target && typeof this.target === 'string') {
        const el = document.querySelector(this.target)
        if (el !== null) {
          this.anchorEl = el
          this.__configureAnchorEl()
        }
        else {
          this.anchorEl = void 0
          console.error(`Anchor: target "${this.target}" not found`, this)
        }
      }
      else if (this.target !== false) {
        this.__setAnchorEl(this.parentEl)
      }
      else {
        this.anchorEl = void 0
      }
    }
  },

  created () {
    if (
      typeof this.__configureScrollTarget === 'function' &&
      typeof this.__unconfigureScrollTarget === 'function'
    ) {
      this.noParentEventWatcher = this.$watch('noParentEvent', () => {
        if (this.scrollTarget !== void 0) {
          this.__unconfigureScrollTarget()
          this.__configureScrollTarget()
        }
      })
    }
  },

  mounted () {
    this.parentEl = this.$el.parentNode
    this.__pickAnchorEl()

    if (this.value !== false && this.anchorEl === void 0) {
      this.$emit('input', false)
    }
  },

  beforeDestroy () {
    clearTimeout(this.touchTimer)
    this.noParentEventWatcher !== void 0 && this.noParentEventWatcher()
    this.__anchorCleanup !== void 0 && this.__anchorCleanup()

    if (this.anchorEl !== void 0) {
      this.__unconfigureAnchorEl()
    }
  }
}
