const fs = require('fs')

fs.writeFileSync(
  'node_modules/react-native-screens/src/fabric/FullWindowOverlayNativeComponent.ts',
`// @ts-nocheck
import type {HostComponent, ViewProps} from 'react-native';
const { requireNativeComponent } = require('react-native');

type NativeProps = ViewProps & {
  accessibilityContainerViewIsModal?: boolean;
};

const RNSFullWindowOverlay = requireNativeComponent('RNSFullWindowOverlay');
export default RNSFullWindowOverlay as HostComponent<NativeProps>;
`)
console.log('Rewrote: FullWindowOverlayNativeComponent.ts')

fs.writeFileSync(
  'node_modules/react-native-screens/src/fabric/ScreenStackHeaderSubviewNativeComponent.ts',
`// @ts-nocheck
import type {HostComponent, ViewProps} from 'react-native';
const { requireNativeComponent } = require('react-native');

type NativeProps = ViewProps & {
  type?: string;
};

const RNSScreenStackHeaderSubview = requireNativeComponent('RNSScreenStackHeaderSubview');
export default RNSScreenStackHeaderSubview as HostComponent<NativeProps>;
`)
console.log('Rewrote: ScreenStackHeaderSubviewNativeComponent.ts')

fs.writeFileSync(
  'node_modules/react-native-screens/src/fabric/ScreenStackNativeComponent.ts',
`// @ts-nocheck
import type {HostComponent, ViewProps} from 'react-native';
const { requireNativeComponent } = require('react-native');

type NativeProps = ViewProps & {
  iosPreventReattachmentOfDismissedScreens?: boolean;
};

const RNSScreenStack = requireNativeComponent('RNSScreenStack');
export default RNSScreenStack as HostComponent<NativeProps>;
`)
console.log('Rewrote: ScreenStackNativeComponent.ts')

fs.writeFileSync(
  'node_modules/react-native-screens/src/fabric/ScreenNativeComponent.ts',
`// @ts-nocheck
import type {HostComponent, ViewProps} from 'react-native';
const { requireNativeComponent } = require('react-native');

type NativeProps = ViewProps & {
  activityState?: number;
};

const RNSScreen = requireNativeComponent('RNSScreen');
export default RNSScreen as HostComponent<NativeProps>;
`)
console.log('Rewrote: ScreenNativeComponent.ts')

fs.writeFileSync(
  'node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/bottomsheet/BottomSheetDialogRootView.kt',
`package com.swmansion.rnscreens.bottomsheet

import android.annotation.SuppressLint
import android.view.MotionEvent
import android.view.View
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.JSPointerDispatcher
import com.facebook.react.uimanager.JSTouchDispatcher
import com.facebook.react.uimanager.RootView
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.views.view.ReactViewGroup

@SuppressLint("ViewConstructor")
class BottomSheetDialogRootView(
    val reactContext: ReactContext?,
    private val eventDispatcher: EventDispatcher,
) : ReactViewGroup(reactContext), RootView {

    private val jsTouchDispatcher: JSTouchDispatcher = JSTouchDispatcher(this)
    private var jsPointerDispatcher: JSPointerDispatcher? = null

    override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
        if (changed) {
            assert(childCount == 1)
            getChildAt(0).layout(l, t, r, b)
        }
    }

    override fun onInterceptTouchEvent(event: MotionEvent): Boolean {
        jsTouchDispatcher.handleTouchEvent(event, eventDispatcher)
        jsPointerDispatcher?.handleMotionEvent(event, eventDispatcher, true)
        return super.onInterceptTouchEvent(event)
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        jsTouchDispatcher.handleTouchEvent(event, eventDispatcher)
        jsPointerDispatcher?.handleMotionEvent(event, eventDispatcher, false)
        super.onTouchEvent(event)
        return true
    }

    override fun onInterceptHoverEvent(event: MotionEvent): Boolean {
        jsPointerDispatcher?.handleMotionEvent(event, eventDispatcher, true)
        return super.onHoverEvent(event)
    }

    override fun onHoverEvent(event: MotionEvent): Boolean {
        jsPointerDispatcher?.handleMotionEvent(event, eventDispatcher, false)
        return super.onHoverEvent(event)
    }

    @Deprecated("Deprecated by React Native")
    override fun requestDisallowInterceptTouchEvent(disallowIntercept: Boolean) {}

    override fun onChildStartedNativeGesture(childView: View?, ev: MotionEvent) {
        jsTouchDispatcher.onChildStartedNativeGesture(ev, eventDispatcher)
    }

    override fun onChildEndedNativeGesture(childView: View, ev: MotionEvent) {
        jsTouchDispatcher.onChildEndedNativeGesture(ev, eventDispatcher)
    }

    override fun handleException(t: Throwable) {
        reactContext?.handleException(RuntimeException(t))
    }

    companion object {
        const val TAG = "BottomSheetDialogRootView"
    }
}
`)
console.log('Rewrote: BottomSheetDialogRootView.kt')

const dvPath = 'node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/bottomsheet/DimmingView.kt'
if (fs.existsSync(dvPath)) {
  let c = fs.readFileSync(dvPath, 'utf8')
  c = c.replace(/\s*override fun getPointerEvents\(\)\s*=\s*[^\n]+/g, '')
  c = c.replace(/\s*@Suppress\("OVERRIDE_DEPRECATION"\)\s*\n(?!\s*override)/g, '\n')
  fs.writeFileSync(dvPath, c)
  console.log('Patched KT: DimmingView.kt')
}
fs.writeFileSync(
  'node_modules/react-native-screens/src/fabric/ScreenStackHeaderConfigNativeComponent.ts',
`// @ts-nocheck
import type {HostComponent, ViewProps} from 'react-native';
const { requireNativeComponent } = require('react-native');

type NativeProps = ViewProps & {
  hidden?: boolean;
  color?: string;
  fontSize?: number;
  onAttached?: () => void;
  onDetached?: () => void;
};

const RNSScreenStackHeaderConfig = requireNativeComponent('RNSScreenStackHeaderConfig');
export default RNSScreenStackHeaderConfig as HostComponent<NativeProps>;
`)
console.log('Rewrote: ScreenStackHeaderConfigNativeComponent.ts')

console.log('All patches applied successfully!')