/* @flow */

import React from 'react';
import {
  Animated,
  TouchableWithoutFeedback,
  StyleSheet,
  View,
  Platform,
} from 'react-native';
import SafeAreaView from 'react-navigation';

import CrossFadeIcon from './CrossFadeIcon';
import withDimensions from '../utils/withDimensions';

export type TabBarOptions = {
  activeTintColor?: string,
  inactiveTintColor?: string,
  activeBackgroundColor?: string,
  inactiveBackgroundColor?: string,
  allowFontScaling: boolean,
  showLabel: boolean,
  showIcon: boolean,
  labelStyle: any,
  tabStyle: any,
  adaptive?: boolean,
  style: any,
};

type Props = TabBarOptions & {
  navigation: any,
  descriptors: any,
  jumpTo: any,
  onTabPress: any,
  getAccessibilityLabel: (props: { route: any }) => string,
  getButtonComponent: ({ route: any }) => any,
  getLabelText: ({ route: any }) => any,
  getTestID: (props: { route: any }) => string,
  renderIcon: any,
  dimensions: { width: number, height: number },
  isLandscape: boolean,
  safeAreaInset: { top: string, right: string, bottom: string, left: string },
};

const majorVersion = parseInt(Platform.Version, 10);
const isIos = Platform.OS === 'ios';
const isIOS11 = majorVersion >= 11 && isIos;

const DEFAULT_MAX_TAB_ITEM_WIDTH = 125;

class TouchableWithoutFeedbackWrapper extends React.Component<*> {
  render() {
    const { onPress, testID, accessibilityLabel, ...props } = this.props;

    return (
      <TouchableWithoutFeedback
        onPress={onPress}
        testID={testID}
        accessibilityLabel={accessibilityLabel}
      >
        <View {...props} />
      </TouchableWithoutFeedback>
    );
  }
}

class TabBarBottom extends React.Component<Props> {
  static defaultProps = {
    activeTintColor: '#3478f6', // Default active tint color in iOS 10
    activeBackgroundColor: 'transparent',
    inactiveTintColor: '#929292', // Default inactive tint color in iOS 10
    inactiveBackgroundColor: 'transparent',
    showLabel: true,
    showIcon: true,
    allowFontScaling: true,
    adaptive: isIOS11,
    safeAreaInset: { bottom: 'always', top: 'never' },
  };

  _renderLabel = ({ route, focused }) => {
    const {
      activeTintColor,
      inactiveTintColor,
      labelStyle,
      showLabel,
      showIcon,
      allowFontScaling,
    } = this.props;

    if (showLabel === false) {
      return null;
    }

    const label = this.props.getLabelText({ route });
    const tintColor = focused ? activeTintColor : inactiveTintColor;

    if (typeof label === 'string') {
      return (
        <Animated.Text
          numberOfLines={1}
          style={[
            styles.label,
            { color: tintColor },
            showIcon && this._shouldUseHorizontalLabels()
              ? styles.labelBeside
              : styles.labelBeneath,
            styles.labelBeneath,
            labelStyle,
          ]}
          allowFontScaling={allowFontScaling}
        >
          {label}
        </Animated.Text>
      );
    }

    if (typeof label === 'function') {
      return label({ route, focused, tintColor });
    }

    return label;
  };

  _renderIcon = ({ route, focused }) => {
    const {
      navigation,
      activeTintColor,
      inactiveTintColor,
      renderIcon,
      showIcon,
      showLabel,
    } = this.props;
    if (showIcon === false) {
      return null;
    }

    const horizontal = this._shouldUseHorizontalLabels();

    const activeOpacity = focused ? 1 : 0;
    const inactiveOpacity = focused ? 0 : 1;

    return (
      <CrossFadeIcon
        route={route}
        navigation={navigation}
        activeOpacity={activeOpacity}
        inactiveOpacity={inactiveOpacity}
        activeTintColor={activeTintColor}
        inactiveTintColor={inactiveTintColor}
        renderIcon={renderIcon}
        style={[
          styles.iconWithExplicitHeight,
          showLabel === false && !horizontal && styles.iconWithoutLabel,
          showLabel !== false && !horizontal && styles.iconWithLabel,
        ]}
      />
    );
  };

  _shouldUseHorizontalLabels = () => {
    const { routes } = this.props.navigation.state;
    const { isLandscape, dimensions, adaptive, tabStyle } = this.props;

    if (!adaptive) {
      return false;
    }

    if (Platform.isPad) {
      let maxTabItemWidth = DEFAULT_MAX_TAB_ITEM_WIDTH;

      const flattenedStyle = StyleSheet.flatten(tabStyle);

      if (flattenedStyle) {
        if (typeof flattenedStyle.width === 'number') {
          maxTabItemWidth = flattenedStyle.width;
        } else if (typeof flattenedStyle.maxWidth === 'number') {
          maxTabItemWidth = flattenedStyle.maxWidth;
        }
      }

      return routes.length * maxTabItemWidth <= dimensions.width;
    } else {
      return isLandscape;
    }
  };

  render() {
    const {
      navigation,
      activeBackgroundColor,
      inactiveBackgroundColor,
      onTabPress,
      safeAreaInset,
      style,
      tabStyle,
    } = this.props;

    const { routes } = navigation.state;

    const tabBarStyle = [
      styles.tabBar,
      this._shouldUseHorizontalLabels() && !Platform.isPad
        ? styles.tabBarCompact
        : styles.tabBarRegular,
      style,
    ];

    return (
      <SafeAreaView style={tabBarStyle} forceInset={safeAreaInset}>
        {routes.map((route, index) => {
          const focused = index === navigation.state.index;
          const scene = { route, focused };
          const accessibilityLabel = this.props.getAccessibilityLabel({
            route,
          });
          const testID = this.props.getTestID({ route });

          const backgroundColor = focused
            ? activeBackgroundColor
            : inactiveBackgroundColor;

          const ButtonComponent =
            this.props.getButtonComponent({ route }) ||
            TouchableWithoutFeedbackWrapper;

          return (
            <ButtonComponent
              key={route.key}
              onPress={() => onTabPress({ route })}
              testID={testID}
              accessibilityLabel={accessibilityLabel}
              style={[
                styles.tab,
                { backgroundColor },
                this._shouldUseHorizontalLabels()
                  ? styles.tabLandscape
                  : styles.tabPortrait,
                tabStyle,
              ]}
            >
              {this._renderIcon(scene)}
              {this._renderLabel(scene)}
            </ButtonComponent>
          );
        })}
      </SafeAreaView>
    );
  }
}

const DEFAULT_HEIGHT = 49;
const COMPACT_HEIGHT = 29;

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#F7F7F7', // Default background color in iOS 10
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0, 0, 0, .3)',
    flexDirection: 'row',
  },
  tabBarCompact: {
    height: COMPACT_HEIGHT,
  },
  tabBarRegular: {
    height: DEFAULT_HEIGHT,
  },
  tab: {
    flex: 1,
    alignItems: isIos ? 'center' : 'stretch',
  },
  tabPortrait: {
    justifyContent: 'flex-end',
    flexDirection: 'column',
  },
  tabLandscape: {
    justifyContent: 'center',
    flexDirection: 'row',
  },
  iconWithoutLabel: {
    flex: 1,
  },
  iconWithLabel: {
    flex: 1,
  },
  iconWithExplicitHeight: {
    height: Platform.isPad ? DEFAULT_HEIGHT : COMPACT_HEIGHT,
  },
  label: {
    textAlign: 'center',
    backgroundColor: 'transparent',
  },
  labelBeneath: {
    fontSize: 10,
    marginBottom: 1.5,
  },
  labelBeside: {
    fontSize: 13,
    marginLeft: 20,
  },
});

export default withDimensions(TabBarBottom);
