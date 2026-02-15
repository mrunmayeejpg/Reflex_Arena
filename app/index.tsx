import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, Platform } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  interpolate,
  FadeIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useGame } from '@/contexts/GameContext';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

function FloatingOrb({ delay, x, y, size, color }: { delay: number; x: number; y: number; size: number; color: string }) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-20, { duration: 2000 + Math.random() * 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(20, { duration: 2000 + Math.random() * 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.6, { duration: 1500 }),
          withTiming(0.2, { duration: 1500 })
        ),
        -1,
        true
      )
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x,
          top: y,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animStyle,
      ]}
    />
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { resetScores } = useGame();
  const pulseScale = useSharedValue(1);
  const titleGlow = useSharedValue(0);

  useEffect(() => {
    resetScores();
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    titleGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(0, { duration: 2000 })
      ),
      -1,
      true
    );
  }, []);

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const titleAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(titleGlow.value, [0, 1], [0.8, 1]),
  }));

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push('/game-intro');
  };

  const orbs = [
    { delay: 0, x: width * 0.1, y: height * 0.15, size: 80, color: 'rgba(255, 59, 59, 0.15)' },
    { delay: 300, x: width * 0.7, y: height * 0.25, size: 60, color: 'rgba(255, 107, 53, 0.12)' },
    { delay: 600, x: width * 0.3, y: height * 0.6, size: 100, color: 'rgba(168, 85, 247, 0.1)' },
    { delay: 900, x: width * 0.8, y: height * 0.7, size: 50, color: 'rgba(59, 130, 246, 0.12)' },
    { delay: 200, x: width * 0.05, y: height * 0.8, size: 70, color: 'rgba(255, 217, 61, 0.08)' },
  ];

  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0A0A1A', '#0F0A1E', '#1A0A20', '#0A0A1A']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {orbs.map((orb, i) => (
        <FloatingOrb key={i} {...orb} />
      ))}

      <View style={[styles.content, { paddingTop: insets.top + webTopInset + 40, paddingBottom: insets.bottom + webBottomInset + 20 }]}>
        <Animated.View entering={FadeIn.delay(200).duration(800)} style={styles.topSection}>
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={[Colors.accent, Colors.accentOrange]}
              style={styles.iconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="flash" size={40} color="#fff" />
            </LinearGradient>
          </View>

          <Animated.Text style={[styles.title, titleAnimStyle]}>
            REFLEX
          </Animated.Text>
          <Text style={styles.titleAccent}>ARENA</Text>

          <View style={styles.divider} />

          <Text style={styles.subtitle}>
            3 challenges. 1 score.{'\n'}How fast are you?
          </Text>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(600).duration(800)} style={styles.gamesPreview}>
          <GamePreviewItem icon="ellipse" label="Color Tap" color={Colors.accent} index={0} />
          <GamePreviewItem icon="hammer" label="Whack-a-Mole" color={Colors.accentOrange} index={1} />
          <GamePreviewItem icon="timer" label="Reaction" color={Colors.accentBlue} index={2} />
        </Animated.View>

        <Animated.View entering={FadeIn.delay(1000).duration(800)} style={styles.bottomSection}>
          <Animated.View style={buttonAnimStyle}>
            <Pressable
              onPress={handleStart}
              style={({ pressed }) => [
                styles.startButton,
                pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
              ]}
            >
              <LinearGradient
                colors={[Colors.accent, '#FF1A1A', Colors.accentOrange]}
                style={styles.startButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="play" size={28} color="#fff" />
                <Text style={styles.startButtonText}>START</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </View>
    </View>
  );
}

function GamePreviewItem({ icon, label, color, index }: { icon: string; label: string; color: string; index: number }) {
  return (
    <Animated.View entering={FadeIn.delay(800 + index * 150).duration(600)} style={styles.previewItem}>
      <View style={[styles.previewDot, { backgroundColor: color }]}>
        <Ionicons name={icon as any} size={18} color="#fff" />
      </View>
      <Text style={styles.previewLabel}>{label}</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  topSection: {
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Orbitron_900Black',
    fontSize: 48,
    color: Colors.text,
    letterSpacing: 6,
  },
  titleAccent: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 36,
    color: Colors.accent,
    letterSpacing: 12,
    marginTop: -4,
  },
  divider: {
    width: 60,
    height: 3,
    backgroundColor: Colors.accent,
    borderRadius: 2,
    marginVertical: 16,
    opacity: 0.6,
  },
  subtitle: {
    fontFamily: 'Orbitron_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: 1,
  },
  gamesPreview: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'center',
  },
  previewItem: {
    alignItems: 'center',
    gap: 8,
  },
  previewDot: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewLabel: {
    fontFamily: 'Orbitron_400Regular',
    fontSize: 9,
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  bottomSection: {
    alignItems: 'center',
    width: '100%',
  },
  startButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 60,
    gap: 12,
  },
  startButtonText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 20,
    color: '#fff',
    letterSpacing: 4,
  },
});
