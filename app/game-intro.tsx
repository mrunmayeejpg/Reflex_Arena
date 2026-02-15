import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  runOnJS,
  FadeIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function GameIntroScreen() {
  const insets = useSafeAreaInsets();
  const textScale = useSharedValue(0.5);
  const textOpacity = useSharedValue(0);
  const questionOpacity = useSharedValue(0);
  const glowIntensity = useSharedValue(0);

  const navigateToGame = () => {
    router.replace('/game-color-tap');
  };

  useEffect(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    textOpacity.value = withTiming(1, { duration: 600 });
    textScale.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.back(1.5)) });

    questionOpacity.value = withDelay(800, withTiming(1, { duration: 600 }));

    glowIntensity.value = withDelay(
      1400,
      withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0.6, { duration: 300 })
      )
    );

    const timer = setTimeout(() => {
      runOnJS(navigateToGame)();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ scale: textScale.value }],
  }));

  const questionStyle = useAnimatedStyle(() => ({
    opacity: questionOpacity.value,
  }));

  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0A0A1A', '#1A0515', '#0A0A1A']}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.content, { paddingTop: insets.top + webTopInset }]}>
        <Animated.View style={[styles.titleContainer, titleStyle]}>
          <Text style={styles.areText}>ARE YOUR</Text>
          <Text style={styles.reflexText}>REFLEXES</Text>
          <Text style={styles.fastText}>FAST ENOUGH</Text>
        </Animated.View>

        <Animated.View style={[styles.questionContainer, questionStyle]}>
          <Text style={styles.questionMark}>?</Text>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(2000).duration(500)} style={styles.loadingContainer}>
          <View style={styles.loadingBar}>
            <LoadingBarFill />
          </View>
          <Text style={styles.loadingText}>PREPARING CHALLENGES...</Text>
        </Animated.View>
      </View>
    </View>
  );
}

function LoadingBarFill() {
  const fillWidth = useSharedValue(0);

  useEffect(() => {
    fillWidth.value = withTiming(100, { duration: 1000, easing: Easing.inOut(Easing.ease) });
  }, []);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${fillWidth.value}%` as any,
  }));

  return (
    <Animated.View style={[styles.loadingFill, fillStyle]}>
      <LinearGradient
        colors={[Colors.accent, Colors.accentOrange]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  titleContainer: {
    alignItems: 'center',
    gap: 4,
  },
  areText: {
    fontFamily: 'Orbitron_400Regular',
    fontSize: 20,
    color: Colors.textSecondary,
    letterSpacing: 8,
  },
  reflexText: {
    fontFamily: 'Orbitron_900Black',
    fontSize: 42,
    color: Colors.accent,
    letterSpacing: 4,
  },
  fastText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 28,
    color: Colors.text,
    letterSpacing: 4,
  },
  questionContainer: {
    marginTop: 8,
  },
  questionMark: {
    fontFamily: 'Orbitron_900Black',
    fontSize: 64,
    color: Colors.accentOrange,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 120,
    alignItems: 'center',
    gap: 12,
    width: '80%',
  },
  loadingBar: {
    width: '100%',
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingFill: {
    height: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingText: {
    fontFamily: 'Orbitron_400Regular',
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 3,
  },
});
